import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getActiveTournaments = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    return await ctx.db
      .query("tournaments")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .filter((q) => q.lt(q.field("startTime"), now))
      .filter((q) => q.gt(q.field("endTime"), now))
      .collect();
  },
});

export const getUpcomingTournaments = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    return await ctx.db
      .query("tournaments")
      .withIndex("by_start_time", (q) => q.gt("startTime", now))
      .take(10);
  },
});

export const joinTournament = mutation({
  args: {
    tournamentId: v.id("tournaments"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const tournament = await ctx.db.get(args.tournamentId);
    if (!tournament) throw new Error("Tournament not found");
    
    if (tournament.participants.includes(userId)) {
      throw new Error("Already joined tournament");
    }
    
    if (tournament.participants.length >= tournament.maxParticipants) {
      throw new Error("Tournament is full");
    }
    
    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    
    if (!wallet) throw new Error("Wallet not found");
    if (wallet.balance < tournament.entryFee) throw new Error("Insufficient balance");
    
    // Deduct entry fee
    await ctx.db.patch(wallet._id, {
      balance: wallet.balance - tournament.entryFee,
    });
    
    // Add to tournament
    await ctx.db.patch(args.tournamentId, {
      participants: [...tournament.participants, userId],
      prizePool: tournament.prizePool + tournament.entryFee,
    });
    
    await ctx.db.insert("transactions", {
      userId,
      type: "bet",
      amount: -tournament.entryFee,
      description: `Tournament entry: ${tournament.name}`,
    });
    
    return args.tournamentId;
  },
});

export const createTournament = mutation({
  args: {
    name: v.string(),
    gameType: v.union(
      v.literal("roulette"), 
      v.literal("blackjack"), 
      v.literal("poker"), 
      v.literal("slots"), 
      v.literal("baccarat"), 
      v.literal("multi")
    ),
    entryFee: v.number(),
    maxParticipants: v.number(),
    duration: v.number(), // in minutes
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    // Check admin permissions (simplified)
    const user = await ctx.db.get(userId);
    if (!user || user.email !== "admin@casino.com") {
      throw new Error("Admin access required");
    }
    
    const startTime = Date.now() + (5 * 60 * 1000); // Start in 5 minutes
    const endTime = startTime + (args.duration * 60 * 1000);
    
    return await ctx.db.insert("tournaments", {
      name: args.name,
      gameType: args.gameType,
      entryFee: args.entryFee,
      prizePool: 0,
      maxParticipants: args.maxParticipants,
      startTime,
      endTime,
      status: "upcoming",
      participants: [],
      leaderboard: [],
    });
  },
});

export const createMultiGameTournament = mutation({
  args: {
    name: v.string(),
    entryFee: v.number(),
    maxParticipants: v.number(),
    duration: v.number(),
    games: v.array(v.union(
      v.literal("roulette"), 
      v.literal("blackjack"), 
      v.literal("poker"), 
      v.literal("slots"), 
      v.literal("baccarat")
    )),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const user = await ctx.db.get(userId);
    if (!user || user.email !== "admin@casino.com") {
      throw new Error("Admin access required");
    }
    
    const startTime = Date.now() + (10 * 60 * 1000); // Start in 10 minutes
    const endTime = startTime + (args.duration * 60 * 1000);
    
    return await ctx.db.insert("tournaments", {
      name: args.name,
      gameType: "multi",
      entryFee: args.entryFee,
      prizePool: 0,
      maxParticipants: args.maxParticipants,
      startTime,
      endTime,
      status: "upcoming",
      participants: [],
      leaderboard: [],
    });
  },
});

export const updateTournamentScore = mutation({
  args: {
    tournamentId: v.id("tournaments"),
    userId: v.id("users"),
    gameType: v.string(),
    score: v.number(),
  },
  handler: async (ctx, args) => {
    const tournament = await ctx.db.get(args.tournamentId);
    if (!tournament) throw new Error("Tournament not found");
    
    const leaderboard = [...tournament.leaderboard];
    const existingEntry = leaderboard.find(entry => entry.userId === args.userId);
    
    if (existingEntry) {
      existingEntry.score += args.score;
    } else {
      leaderboard.push({
        userId: args.userId,
        score: args.score,
        position: 0, // Will be calculated when sorting
      });
    }
    
    // Sort and update positions
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard.forEach((entry, index) => {
      entry.position = index + 1;
    });
    
    await ctx.db.patch(args.tournamentId, { leaderboard });
    
    return leaderboard;
  },
});
