import { v } from "convex/values";
import { query, mutation, internalMutation } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "../_generated/api";

const ROULETTE_NUMBERS = Array.from({ length: 37 }, (_, i) => i); // 0-36
const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const BLACK_NUMBERS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

export const getActiveTables = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("gameTables")
      .withIndex("by_type", (q) => q.eq("gameType", "roulette"))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

export const joinTable = mutation({
  args: {
    tableId: v.id("gameTables"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const table = await ctx.db.get(args.tableId);
    if (!table) throw new Error("Table not found");
    
    // Find or create current game
    let currentGame = await ctx.db
      .query("games")
      .withIndex("by_table", (q) => q.eq("tableId", args.tableId))
      .filter((q) => q.neq(q.field("status"), "finished"))
      .first();
    
    if (!currentGame) {
      // Create new game
      const gameId = await ctx.db.insert("games", {
        tableId: args.tableId,
        gameType: "roulette",
        players: [userId],
        spectators: [],
        bets: [],
        status: "waiting",
        roundNumber: 1,
        seed: Math.random().toString(36).substring(7),
      });
      return gameId;
    } else {
      // Join existing game
      if (!currentGame.players.includes(userId) && !currentGame.spectators.includes(userId)) {
        if (currentGame.players.length < table.maxPlayers) {
          await ctx.db.patch(currentGame._id, {
            players: [...currentGame.players, userId],
          });
        } else {
          await ctx.db.patch(currentGame._id, {
            spectators: [...currentGame.spectators, userId],
          });
        }
      }
      return currentGame._id;
    }
  },
});

export const placeBet = mutation({
  args: {
    gameId: v.id("games"),
    amount: v.number(),
    betType: v.string(),
    betValue: v.any(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");
    if (game.status !== "betting") throw new Error("Betting is not open");
    
    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    
    if (!wallet) throw new Error("Wallet not found");
    if (wallet.balance < args.amount) throw new Error("Insufficient balance");
    
    const table = await ctx.db.get(game.tableId);
    if (!table) throw new Error("Table not found");
    if (args.amount < table.minBet || args.amount > table.maxBet) {
      throw new Error(`Bet must be between ${table.minBet} and ${table.maxBet}`);
    }
    
    // Deduct bet from wallet
    await ctx.db.patch(wallet._id, {
      balance: wallet.balance - args.amount,
    });
    
    // Record transaction
    await ctx.db.insert("transactions", {
      userId,
      type: "bet",
      amount: -args.amount,
      description: `Roulette bet: ${args.betType}`,
      gameId: args.gameId,
    });
    
    // Add bet to game
    const existingBetIndex = game.bets.findIndex(bet => bet.userId === userId && bet.betType === args.betType);
    let newBets = [...game.bets];
    
    if (existingBetIndex >= 0) {
      // Update existing bet
      newBets[existingBetIndex] = {
        ...newBets[existingBetIndex],
        amount: newBets[existingBetIndex].amount + args.amount,
      };
    } else {
      // Add new bet
      newBets.push({
        userId,
        amount: args.amount,
        betType: args.betType,
        betValue: args.betValue,
      });
    }
    
    await ctx.db.patch(args.gameId, {
      bets: newBets,
    });
    
    return args.gameId;
  },
});

export const spinRoulette = mutation({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");
    if (game.status !== "betting") throw new Error("Game is not in betting phase");
    
    // Generate winning number using seeded random
    const seed = parseInt(game.seed, 36);
    const winningNumber = Math.floor((seed * 982451653) % 37);
    
    const result = {
      number: winningNumber,
      color: winningNumber === 0 ? "green" : RED_NUMBERS.includes(winningNumber) ? "red" : "black",
      isEven: winningNumber !== 0 && winningNumber % 2 === 0,
      isOdd: winningNumber !== 0 && winningNumber % 2 === 1,
      isLow: winningNumber >= 1 && winningNumber <= 18,
      isHigh: winningNumber >= 19 && winningNumber <= 36,
    };
    
    // Calculate winnings for each bet
    const payouts: Record<string, number> = {};
    
    for (const bet of game.bets) {
      let payout = 0;
      
      switch (bet.betType) {
        case "straight":
          if (bet.betValue === winningNumber) payout = bet.amount * 35;
          break;
        case "red":
          if (result.color === "red") payout = bet.amount * 2;
          break;
        case "black":
          if (result.color === "black") payout = bet.amount * 2;
          break;
        case "even":
          if (result.isEven) payout = bet.amount * 2;
          break;
        case "odd":
          if (result.isOdd) payout = bet.amount * 2;
          break;
        case "low":
          if (result.isLow) payout = bet.amount * 2;
          break;
        case "high":
          if (result.isHigh) payout = bet.amount * 2;
          break;
      }
      
      if (payout > 0) {
        payouts[bet.userId] = (payouts[bet.userId] || 0) + payout;
      }
    }
    
    // Update wallets and record winnings
    for (const [userId, amount] of Object.entries(payouts)) {
      const wallet = await ctx.db
        .query("wallets")
        .withIndex("by_user", (q) => q.eq("userId", userId as any))
        .unique();
      
      if (wallet) {
        await ctx.db.patch(wallet._id, {
          balance: wallet.balance + amount,
        });
        
        await ctx.db.insert("transactions", {
          userId: userId as any,
          type: "win",
          amount,
          description: `Roulette win: ${result.number} ${result.color}`,
          gameId: args.gameId,
        });
      }
    }
    
    // Update game
    await ctx.db.patch(args.gameId, {
      result,
      status: "finished",
    });
    
    // Resolve friend bets for this round
    await ctx.runMutation(internal.friendBets.resolveFriendBets, {
      roundId: `round_${game.roundNumber}`,
      gameId: args.gameId,
    });
    
    // Schedule new round
    await ctx.scheduler.runAfter(5000, internal.games.roulette.startNewRound, {
      tableId: game.tableId,
    });
    
    return result;
  },
});

export const startNewRound = internalMutation({
  args: {
    tableId: v.id("gameTables"),
  },
  handler: async (ctx, args) => {
    // Create new game round
    await ctx.db.insert("games", {
      tableId: args.tableId,
      gameType: "roulette",
      players: [],
      spectators: [],
      bets: [],
      status: "betting",
      roundNumber: 1,
      seed: Math.random().toString(36).substring(7),
    });
    
    // Update table
    await ctx.db.patch(args.tableId, {
      roundStartTime: Date.now(),
      roundEndTime: Date.now() + 30000, // 30 seconds betting time
    });
  },
});

export const getCurrentGame = query({
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
