import { v } from "convex/values";
import { query, mutation } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getActiveTables = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("gameTables")
      .withIndex("by_type", (q) => q.eq("gameType", "blackjack"))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

export const joinBlackjackTable = mutation({
  args: {
    tableId: v.id("gameTables"),
    betAmount: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const table = await ctx.db.get(args.tableId);
    if (!table) throw new Error("Table not found");
    
    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    
    if (!wallet) throw new Error("Wallet not found");
    if (wallet.balance < args.betAmount) throw new Error("Insufficient balance");
    if (args.betAmount < table.minBet || args.betAmount > table.maxBet) {
      throw new Error(`Bet must be between ${table.minBet} and ${table.maxBet}`);
    }
    
    // Deduct bet from wallet
    await ctx.db.patch(wallet._id, {
      balance: wallet.balance - args.betAmount,
    });
    
    await ctx.db.insert("transactions", {
      userId,
      type: "bet",
      amount: -args.betAmount,
      description: "Blackjack bet",
    });
    
    // Create simple game record
    const gameId = await ctx.db.insert("games", {
      tableId: args.tableId,
      gameType: "blackjack",
      players: [userId],
      spectators: [],
      bets: [{
        userId,
        amount: args.betAmount,
        betType: "main",
        betValue: null,
      }],
      status: "playing",
      roundNumber: 1,
      seed: Math.random().toString(36).substring(7),
    });
    
    return gameId;
  },
});

export const getCurrentBlackjackGame = query({
  args: {
    tableId: v.id("gameTables"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("games")
      .withIndex("by_table", (q) => q.eq("tableId", args.tableId))
      .filter((q) => q.neq(q.field("status"), "finished"))
      .first();
  },
});
