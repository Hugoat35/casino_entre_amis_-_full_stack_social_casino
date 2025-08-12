import { v } from "convex/values";
import { query, mutation } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const SLOT_SYMBOLS = [
  { symbol: "🍒", value: 2, weight: 30 },
  { symbol: "🍋", value: 3, weight: 25 },
  { symbol: "🍊", value: 4, weight: 20 },
  { symbol: "🍇", value: 5, weight: 15 },
  { symbol: "🔔", value: 10, weight: 8 },
  { symbol: "💎", value: 20, weight: 2 },
];

const PAYLINES = [
  [0, 1, 2], // Top row
  [3, 4, 5], // Middle row
  [6, 7, 8], // Bottom row
  [0, 4, 8], // Diagonal
  [2, 4, 6], // Diagonal
];

function generateSlotResult(seed: string): string[] {
  const seedNum = parseInt(seed, 36);
  const result: string[] = [];
  
  for (let i = 0; i < 9; i++) {
    const random = ((seedNum * (i + 1)) % 982451653) / 982451653;
    let totalWeight = 0;
    
    for (const symbol of SLOT_SYMBOLS) {
      totalWeight += symbol.weight;
      if (random * 100 <= totalWeight) {
        result.push(symbol.symbol);
        break;
      }
    }
  }
  
  return result;
}

function calculateWinnings(symbols: string[], bet: number): { winnings: number; winningLines: number[] } {
  let totalWinnings = 0;
  const winningLines: number[] = [];
  
  PAYLINES.forEach((line, lineIndex) => {
    const lineSymbols = line.map(pos => symbols[pos]);
    
    // Check for three of a kind
    if (lineSymbols[0] === lineSymbols[1] && lineSymbols[1] === lineSymbols[2]) {
      const symbol = SLOT_SYMBOLS.find(s => s.symbol === lineSymbols[0]);
      if (symbol) {
        totalWinnings += bet * symbol.value;
        winningLines.push(lineIndex);
      }
    }
  });
  
  return { winnings: totalWinnings, winningLines };
}

export const getActiveSlotMachines = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("gameTables")
      .withIndex("by_type", (q) => q.eq("gameType", "slots"))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

export const spinSlots = mutation({
  args: {
    tableId: v.id("gameTables"),
    bet: v.number(),
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
    if (wallet.balance < args.bet) throw new Error("Insufficient balance");
    if (args.bet < table.minBet || args.bet > table.maxBet) {
      throw new Error(`Bet must be between ${table.minBet} and ${table.maxBet}`);
    }
    
    // Deduct bet from wallet
    await ctx.db.patch(wallet._id, {
      balance: wallet.balance - args.bet,
    });
    
    // Record bet transaction
    await ctx.db.insert("transactions", {
      userId,
      type: "bet",
      amount: -args.bet,
      description: "Slots spin",
    });
    
    // Generate slot result
    const seed = Math.random().toString(36).substring(7);
    const symbols = generateSlotResult(seed);
    const { winnings, winningLines } = calculateWinnings(symbols, args.bet);
    
    // Create game record
    const gameId = await ctx.db.insert("games", {
      tableId: args.tableId,
      gameType: "slots",
      players: [userId],
      spectators: [],
      bets: [{
        userId,
        amount: args.bet,
        betType: "spin",
        betValue: null,
      }],
      status: "finished",
      roundNumber: 1,
      seed,
      result: {
        symbols,
        winnings,
        winningLines,
      },
    });
    
    // Pay winnings if any
    if (winnings > 0) {
      await ctx.db.patch(wallet._id, {
        balance: wallet.balance + winnings,
      });
      
      await ctx.db.insert("transactions", {
        userId,
        type: "win",
        amount: winnings,
        description: `Slots win: ${winnings} chips`,
        gameId,
      });
    }
    
    return {
      symbols,
      winnings,
      winningLines,
      gameId,
    };
  },
});
