import { v } from "convex/values";
import { query, mutation } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

type Card = {
  suit: "hearts" | "diamonds" | "clubs" | "spades";
  rank: "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";
  value: number;
};

function createBaccaratDeck(): Card[] {
  const suits: Card["suit"][] = ["hearts", "diamonds", "clubs", "spades"];
  const ranks: Card["rank"][] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  
  const deck: Card[] = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      let value = 0;
      if (rank === "A") value = 1;
      else if (["10", "J", "Q", "K"].includes(rank)) value = 0;
      else value = parseInt(rank);
      
      deck.push({ suit, rank, value });
    }
  }
  
  // Shuffle deck
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  
  return deck;
}

function calculateBaccaratValue(cards: Card[]): number {
  return cards.reduce((sum, card) => sum + card.value, 0) % 10;
}

export const getActiveBaccaratTables = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("gameTables")
      .withIndex("by_type", (q) => q.eq("gameType", "baccarat"))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

export const placeBaccaratBet = mutation({
  args: {
    tableId: v.id("gameTables"),
    betType: v.union(v.literal("player"), v.literal("banker"), v.literal("tie")),
    amount: v.number(),
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
    if (wallet.balance < args.amount) throw new Error("Insufficient balance");
    if (args.amount < table.minBet || args.amount > table.maxBet) {
      throw new Error(`Bet must be between ${table.minBet} and ${table.maxBet}`);
    }
    
    // Deduct bet from wallet
    await ctx.db.patch(wallet._id, {
      balance: wallet.balance - args.amount,
    });
    
    // Record bet transaction
    await ctx.db.insert("transactions", {
      userId,
      type: "bet",
      amount: -args.amount,
      description: `Baccarat bet: ${args.betType}`,
    });
    
    // Create deck and deal cards
    const deck = createBaccaratDeck();
    const playerCards = [deck.pop()!, deck.pop()!];
    const bankerCards = [deck.pop()!, deck.pop()!];
    
    let playerValue = calculateBaccaratValue(playerCards);
    let bankerValue = calculateBaccaratValue(bankerCards);
    
    // Third card rules
    let playerThirdCard: Card | null = null;
    let bankerThirdCard: Card | null = null;
    
    // Player third card rule
    if (playerValue <= 5 && bankerValue < 8) {
      playerThirdCard = deck.pop()!;
      playerCards.push(playerThirdCard);
      playerValue = calculateBaccaratValue(playerCards);
    }
    
    // Banker third card rule (simplified)
    if (bankerValue <= 5 && playerValue < 8) {
      bankerThirdCard = deck.pop()!;
      bankerCards.push(bankerThirdCard);
      bankerValue = calculateBaccaratValue(bankerCards);
    }
    
    // Determine winner
    let winner: "player" | "banker" | "tie";
    if (playerValue > bankerValue) winner = "player";
    else if (bankerValue > playerValue) winner = "banker";
    else winner = "tie";
    
    // Calculate payout
    let payout = 0;
    if (args.betType === winner) {
      if (winner === "player") payout = args.amount * 2;
      else if (winner === "banker") payout = args.amount * 1.95; // 5% commission
      else if (winner === "tie") payout = args.amount * 8;
    }
    
    // Create game record
    const gameId = await ctx.db.insert("games", {
      tableId: args.tableId,
      gameType: "baccarat",
      players: [userId],
      spectators: [],
      bets: [{
        userId,
        amount: args.amount,
        betType: args.betType,
        betValue: args.betType,
      }],
      status: "finished",
      roundNumber: 1,
      seed: Math.random().toString(36).substring(7),
      result: {
        playerCards,
        bankerCards,
        playerValue,
        bankerValue,
        winner,
        payout,
      },
    });
    
    // Pay winnings if any
    if (payout > 0) {
      await ctx.db.patch(wallet._id, {
        balance: wallet.balance + payout,
      });
      
      await ctx.db.insert("transactions", {
        userId,
        type: "win",
        amount: payout,
        description: `Baccarat win: ${winner}`,
        gameId,
      });
    }
    
    return {
      playerCards,
      bankerCards,
      playerValue,
      bankerValue,
      winner,
      payout,
      gameId,
    };
  },
});
