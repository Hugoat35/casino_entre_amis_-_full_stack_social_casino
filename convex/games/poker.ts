import { v } from "convex/values";
import { query, mutation, internalMutation } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "../_generated/api";

type Card = {
  suit: "hearts" | "diamonds" | "clubs" | "spades";
  rank: "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";
  value: number;
};

type PokerHand = {
  cards: Card[];
  handType: string;
  handRank: number;
};

type PlayerState = {
  userId: string;
  chips: number;
  cards: Card[];
  currentBet: number;
  totalBet: number;
  status: "waiting" | "folded" | "called" | "raised" | "all-in";
  position: number;
};

function createDeck(): Card[] {
  const suits: Card["suit"][] = ["hearts", "diamonds", "clubs", "spades"];
  const ranks: Card["rank"][] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  
  const deck: Card[] = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({
        suit,
        rank,
        value: rank === "A" ? 14 : ["J", "Q", "K"].includes(rank) ? 
               (rank === "J" ? 11 : rank === "Q" ? 12 : 13) : parseInt(rank),
      });
    }
  }
  
  // Shuffle deck
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  
  return deck;
}

function evaluateHand(cards: Card[]): PokerHand {
  // Simplified hand evaluation - in a real implementation, this would be more complex
  const sortedCards = [...cards].sort((a, b) => b.value - a.value);
  
  // Check for pairs, straights, flushes, etc.
  const ranks = sortedCards.map(c => c.value);
  const suits = sortedCards.map(c => c.suit);
  
  const isFlush = suits.every(suit => suit === suits[0]);
  const isStraight = ranks.every((rank, i) => i === 0 || rank === ranks[i-1] - 1);
  
  if (isFlush && isStraight) {
    return { cards: sortedCards, handType: "Straight Flush", handRank: 8 };
  } else if (isFlush) {
    return { cards: sortedCards, handType: "Flush", handRank: 5 };
  } else if (isStraight) {
    return { cards: sortedCards, handType: "Straight", handRank: 4 };
  }
  
  // Check for pairs, three of a kind, etc.
  const rankCounts = ranks.reduce((acc, rank) => {
    acc[rank] = (acc[rank] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  
  const counts = Object.values(rankCounts).sort((a, b) => b - a);
  
  if (counts[0] === 4) {
    return { cards: sortedCards, handType: "Four of a Kind", handRank: 7 };
  } else if (counts[0] === 3 && counts[1] === 2) {
    return { cards: sortedCards, handType: "Full House", handRank: 6 };
  } else if (counts[0] === 3) {
    return { cards: sortedCards, handType: "Three of a Kind", handRank: 3 };
  } else if (counts[0] === 2 && counts[1] === 2) {
    return { cards: sortedCards, handType: "Two Pair", handRank: 2 };
  } else if (counts[0] === 2) {
    return { cards: sortedCards, handType: "Pair", handRank: 1 };
  }
  
  return { cards: sortedCards, handType: "High Card", handRank: 0 };
}

export const getActivePokerTables = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("gameTables")
      .withIndex("by_type", (q) => q.eq("gameType", "poker"))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

export const joinPokerTable = mutation({
  args: {
    tableId: v.id("gameTables"),
    buyIn: v.number(),
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
    if (wallet.balance < args.buyIn) throw new Error("Insufficient balance");
    
    // Find or create current game
    let currentGame = await ctx.db
      .query("games")
      .withIndex("by_table", (q) => q.eq("tableId", args.tableId))
      .filter((q) => q.neq(q.field("status"), "finished"))
      .first();
    
    if (!currentGame) {
      // Create new poker game
      const deck = createDeck();
      
      const gameId = await ctx.db.insert("games", {
        tableId: args.tableId,
        gameType: "poker",
        players: [userId],
        spectators: [],
        bets: [],
        status: "waiting",
        roundNumber: 1,
        seed: Math.random().toString(36).substring(7),
        gameState: {
          deck,
          communityCards: [],
          pot: 0,
          currentBet: 0,
          dealerPosition: 0,
          currentPlayer: 0,
          phase: "preflop", // preflop, flop, turn, river, showdown
          players: [{
            userId,
            chips: args.buyIn,
            cards: [],
            currentBet: 0,
            totalBet: 0,
            status: "waiting",
            position: 0,
          }],
        },
      });
      
      currentGame = await ctx.db.get(gameId);
    } else {
      // Add player to existing game
      const gameState = currentGame.gameState;
      if (gameState.players.length >= table.maxPlayers) {
        throw new Error("Table is full");
      }
      
      gameState.players.push({
        userId,
        chips: args.buyIn,
        cards: [],
        currentBet: 0,
        totalBet: 0,
        status: "waiting",
        position: gameState.players.length,
      });
      
      await ctx.db.patch(currentGame._id, {
        players: [...currentGame.players, userId],
        gameState,
      });
    }
    
    // Deduct buy-in from wallet
    await ctx.db.patch(wallet._id, {
      balance: wallet.balance - args.buyIn,
    });
    
    await ctx.db.insert("transactions", {
      userId,
      type: "bet",
      amount: -args.buyIn,
      description: "Poker buy-in",
      gameId: currentGame!._id,
    });
    
    return currentGame!._id;
  },
});

export const getCurrentPokerGame = query({
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

export const placeBet = mutation({
  args: {
    gameId: v.id("games"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");
    
    const gameState = game.gameState;
    const player = gameState.players.find((p: PlayerState) => p.userId === userId);
    if (!player) throw new Error("Player not in game");
    
    if (player.chips < args.amount) throw new Error("Insufficient chips");
    
    // Update player state
    player.chips -= args.amount;
    player.currentBet = args.amount;
    player.totalBet += args.amount;
    player.status = "raised";
    
    // Update pot
    gameState.pot += args.amount;
    gameState.currentBet = Math.max(gameState.currentBet, args.amount);
    
    await ctx.db.patch(args.gameId, { gameState });
    
    return gameState;
  },
});

export const fold = mutation({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");
    
    const gameState = game.gameState;
    const player = gameState.players.find((p: PlayerState) => p.userId === userId);
    if (!player) throw new Error("Player not in game");
    
    player.status = "folded";
    
    await ctx.db.patch(args.gameId, { gameState });
    
    return gameState;
  },
});

export const call = mutation({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");
    
    const gameState = game.gameState;
    const player = gameState.players.find((p: PlayerState) => p.userId === userId);
    if (!player) throw new Error("Player not in game");
    
    const callAmount = gameState.currentBet - player.currentBet;
    if (player.chips < callAmount) throw new Error("Insufficient chips");
    
    player.chips -= callAmount;
    player.currentBet = gameState.currentBet;
    player.totalBet += callAmount;
    player.status = "called";
    
    gameState.pot += callAmount;
    
    await ctx.db.patch(args.gameId, { gameState });
    
    return gameState;
  },
});

export const raise = mutation({
  args: {
    gameId: v.id("games"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");
    
    const gameState = game.gameState;
    const player = gameState.players.find((p: PlayerState) => p.userId === userId);
    if (!player) throw new Error("Player not in game");
    
    const totalBet = gameState.currentBet + args.amount;
    const playerBetAmount = totalBet - player.currentBet;
    
    if (player.chips < playerBetAmount) throw new Error("Insufficient chips");
    
    player.chips -= playerBetAmount;
    player.currentBet = totalBet;
    player.totalBet += playerBetAmount;
    player.status = "raised";
    
    gameState.pot += playerBetAmount;
    gameState.currentBet = totalBet;
    
    await ctx.db.patch(args.gameId, { gameState });
    
    return gameState;
  },
});
