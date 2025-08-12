import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

// Get friend bet settings (admin configurable)
export const getFriendBetSettings = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("friendBetSettings").first();
    
    // Default settings if none exist
    if (!settings) {
      return {
        isEnabled: true,
        minStake: 10,
        maxStake: 1000,
        gainsMultiplier: 1.8,
        lossesMultiplier: 1.5,
        cooldownMinutes: 5,
        maxActiveBetsPerUser: 3,
      };
    }
    
    return settings;
  },
});

// Update friend bet settings (admin only)
export const updateFriendBetSettings = mutation({
  args: {
    isEnabled: v.boolean(),
    minStake: v.number(),
    maxStake: v.number(),
    gainsMultiplier: v.number(),
    lossesMultiplier: v.number(),
    cooldownMinutes: v.number(),
    maxActiveBetsPerUser: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    // Check if user is admin
    const user = await ctx.db.get(userId);
    if (!user || user.email !== "admin@casino.com") {
      throw new Error("Admin access required");
    }
    
    const existing = await ctx.db.query("friendBetSettings").first();
    
    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    } else {
      return await ctx.db.insert("friendBetSettings", args);
    }
  },
});

// Place a friend bet
export const placeFriendBet = mutation({
  args: {
    targetId: v.id("users"),
    gameId: v.id("games"),
    tableId: v.id("gameTables"),
    roundId: v.string(),
    betType: v.union(v.literal("gains"), v.literal("losses")),
    stake: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    // Get settings
    const settings = await ctx.db.query("friendBetSettings").first();
    if (!settings?.isEnabled) {
      throw new Error("Friend betting is currently disabled");
    }
    
    // Validate stake amount
    if (args.stake < settings.minStake || args.stake > settings.maxStake) {
      throw new Error(`Stake must be between ${settings.minStake} and ${settings.maxStake} tokens`);
    }
    
    // Can't bet on yourself
    if (args.targetId === userId) {
      throw new Error("You cannot bet on yourself");
    }
    
    // Check if users are friends
    const friendship = await ctx.db
      .query("friendships")
      .filter((q) => 
        q.or(
          q.and(q.eq(q.field("requesterId"), userId), q.eq(q.field("addresseeId"), args.targetId)),
          q.and(q.eq(q.field("requesterId"), args.targetId), q.eq(q.field("addresseeId"), userId))
        )
      )
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .first();
    
    if (!friendship) {
      throw new Error("You can only bet on friends");
    }
    
    // Check for existing bet on this target for this round
    const existingBet = await ctx.db
      .query("friendBets")
      .withIndex("by_round", (q) => q.eq("roundId", args.roundId))
      .filter((q) => 
        q.and(
          q.eq(q.field("bettorId"), userId),
          q.eq(q.field("targetId"), args.targetId),
          q.eq(q.field("status"), "active")
        )
      )
      .first();
    
    if (existingBet) {
      throw new Error("You already have an active bet on this friend for this round");
    }
    
    // Check active bets limit
    const activeBets = await ctx.db
      .query("friendBets")
      .withIndex("by_bettor", (q) => q.eq("bettorId", userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
    
    if (activeBets.length >= settings.maxActiveBetsPerUser) {
      throw new Error(`You can have maximum ${settings.maxActiveBetsPerUser} active bets`);
    }
    
    // Check cooldown
    const recentBets = await ctx.db
      .query("friendBets")
      .withIndex("by_bettor", (q) => q.eq("bettorId", userId))
      .order("desc")
      .take(1);
    
    if (recentBets.length > 0) {
      const timeSinceLastBet = Date.now() - recentBets[0]._creationTime;
      const cooldownMs = settings.cooldownMinutes * 60 * 1000;
      
      if (timeSinceLastBet < cooldownMs) {
        const remainingMinutes = Math.ceil((cooldownMs - timeSinceLastBet) / 60000);
        throw new Error(`Please wait ${remainingMinutes} more minutes before placing another bet`);
      }
    }
    
    // Check user's balance
    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    
    if (!wallet || wallet.balance < args.stake) {
      throw new Error("Insufficient balance");
    }
    
    // Get target's current balance
    const targetWallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", args.targetId))
      .unique();
    
    if (!targetWallet) {
      throw new Error("Target user wallet not found");
    }
    
    // Deduct stake from bettor's balance
    await ctx.db.patch(wallet._id, {
      balance: wallet.balance - args.stake,
    });
    
    // Record transaction
    await ctx.db.insert("transactions", {
      userId,
      type: "friend_bet",
      amount: -args.stake,
      description: `Friend bet on ${args.betType} - ${args.roundId}`,
      gameId: args.gameId,
      relatedUserId: args.targetId,
    });
    
    // Create the bet
    const multiplier = args.betType === "gains" ? settings.gainsMultiplier : settings.lossesMultiplier;
    
    return await ctx.db.insert("friendBets", {
      bettorId: userId,
      targetId: args.targetId,
      gameId: args.gameId,
      tableId: args.tableId,
      roundId: args.roundId,
      betType: args.betType,
      stake: args.stake,
      multiplier,
      status: "active",
      targetStartBalance: targetWallet.balance,
    });
  },
});

// Get active friend bets for current user
export const getActiveFriendBets = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    
    const bets = await ctx.db
      .query("friendBets")
      .withIndex("by_bettor", (q) => q.eq("bettorId", userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
    
    // Enrich with target user info
    const enrichedBets = [];
    for (const bet of bets) {
      const targetProfile = await ctx.db
        .query("profiles")
        .withIndex("by_user", (q) => q.eq("userId", bet.targetId))
        .unique();
      
      const game = await ctx.db.get(bet.gameId);
      const table = await ctx.db.get(bet.tableId);
      
      enrichedBets.push({
        ...bet,
        targetUsername: targetProfile?.username || "Unknown",
        targetAvatar: targetProfile?.avatar,
        gameName: table?.name || "Unknown Game",
        gameType: game?.gameType || "unknown",
      });
    }
    
    return enrichedBets;
  },
});

// Get friend bet history
export const getFriendBetHistory = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    
    const bets = await ctx.db
      .query("friendBets")
      .withIndex("by_bettor", (q) => q.eq("bettorId", userId))
      .filter((q) => q.neq(q.field("status"), "active"))
      .order("desc")
      .take(args.limit || 50);
    
    // Enrich with target user info
    const enrichedBets = [];
    for (const bet of bets) {
      const targetProfile = await ctx.db
        .query("profiles")
        .withIndex("by_user", (q) => q.eq("userId", bet.targetId))
        .unique();
      
      const game = await ctx.db.get(bet.gameId);
      const table = await ctx.db.get(bet.tableId);
      
      enrichedBets.push({
        ...bet,
        targetUsername: targetProfile?.username || "Unknown",
        targetAvatar: targetProfile?.avatar,
        gameName: table?.name || "Unknown Game",
        gameType: game?.gameType || "unknown",
      });
    }
    
    return enrichedBets;
  },
});

// Get bets placed on current user
export const getBetsOnUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    
    return await ctx.db
      .query("friendBets")
      .withIndex("by_target", (q) => q.eq("targetId", userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
  },
});

// Cancel a friend bet (only if still active)
export const cancelFriendBet = mutation({
  args: {
    betId: v.id("friendBets"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const bet = await ctx.db.get(args.betId);
    if (!bet) throw new Error("Bet not found");
    
    if (bet.bettorId !== userId) {
      throw new Error("You can only cancel your own bets");
    }
    
    if (bet.status !== "active") {
      throw new Error("Can only cancel active bets");
    }
    
    // Refund the stake
    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    
    if (wallet) {
      await ctx.db.patch(wallet._id, {
        balance: wallet.balance + bet.stake,
      });
      
      // Record refund transaction
      await ctx.db.insert("transactions", {
        userId,
        type: "bonus",
        amount: bet.stake,
        description: `Friend bet cancelled - refund`,
        gameId: bet.gameId,
        relatedUserId: bet.targetId,
      });
    }
    
    // Update bet status
    await ctx.db.patch(args.betId, {
      status: "cancelled",
      resolvedAt: Date.now(),
    });
    
    return args.betId;
  },
});

// Resolve friend bets for a completed round (called internally)
export const resolveFriendBets = internalMutation({
  args: {
    roundId: v.string(),
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const activeBets = await ctx.db
      .query("friendBets")
      .withIndex("by_round", (q) => q.eq("roundId", args.roundId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
    
    for (const bet of activeBets) {
      // Get target's current balance
      const targetWallet = await ctx.db
        .query("wallets")
        .withIndex("by_user", (q) => q.eq("userId", bet.targetId))
        .unique();
      
      if (!targetWallet) continue;
      
      const balanceChange = targetWallet.balance - bet.targetStartBalance;
      let betWon = false;
      
      if (bet.betType === "gains" && balanceChange > 0) {
        betWon = true;
      } else if (bet.betType === "losses" && balanceChange < 0) {
        betWon = true;
      }
      
      let payout = 0;
      if (betWon) {
        payout = Math.round(bet.stake * bet.multiplier);
        
        // Pay out to bettor
        const bettorWallet = await ctx.db
          .query("wallets")
          .withIndex("by_user", (q) => q.eq("userId", bet.bettorId))
          .unique();
        
        if (bettorWallet) {
          await ctx.db.patch(bettorWallet._id, {
            balance: bettorWallet.balance + payout,
          });
          
          // Record win transaction
          await ctx.db.insert("transactions", {
            userId: bet.bettorId,
            type: "friend_bet_win",
            amount: payout,
            description: `Friend bet won - ${bet.betType} on ${bet.roundId}`,
            gameId: bet.gameId,
            relatedUserId: bet.targetId,
          });
        }
      }
      
      // Update bet with resolution
      await ctx.db.patch(bet._id, {
        status: betWon ? "won" : "lost",
        targetEndBalance: targetWallet.balance,
        payout: betWon ? payout : 0,
        resolvedAt: Date.now(),
      });
    }
  },
});

// Get friend bet statistics
export const getFriendBetStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    
    const allBets = await ctx.db
      .query("friendBets")
      .withIndex("by_bettor", (q) => q.eq("bettorId", userId))
      .collect();
    
    const activeBets = allBets.filter(bet => bet.status === "active");
    const wonBets = allBets.filter(bet => bet.status === "won");
    const lostBets = allBets.filter(bet => bet.status === "lost");
    
    const totalStaked = allBets.reduce((sum, bet) => sum + bet.stake, 0);
    const totalWon = wonBets.reduce((sum, bet) => sum + (bet.payout || 0), 0);
    const netProfit = totalWon - totalStaked;
    
    return {
      totalBets: allBets.length,
      activeBets: activeBets.length,
      wonBets: wonBets.length,
      lostBets: lostBets.length,
      winRate: allBets.length > 0 ? (wonBets.length / (wonBets.length + lostBets.length)) * 100 : 0,
      totalStaked,
      totalWon,
      netProfit,
    };
  },
});
