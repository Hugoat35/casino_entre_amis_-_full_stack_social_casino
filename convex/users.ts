import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    
    const user = await ctx.db.get(userId);
    if (!user) return null;
    
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    
    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    
    return {
      ...user,
      profile,
      wallet,
    };
  },
});

export const createProfile = mutation({
  args: {
    username: v.string(),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    // Check if username is taken
    const existingProfile = await ctx.db
      .query("profiles")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();
    
    if (existingProfile) {
      throw new Error("Username already taken");
    }
    
    // Create profile
    const profileId = await ctx.db.insert("profiles", {
      userId,
      username: args.username,
      avatar: args.avatar,
      level: 1,
      xp: 0,
      totalWinnings: 0,
      totalLosses: 0,
      gamesPlayed: 0,
      isOnline: true,
      lastSeen: Date.now(),
    });
    
    // Create wallet with starting balance
    await ctx.db.insert("wallets", {
      userId,
      balance: 1000, // Starting chips
      vault: 0,
      vaultInterestRate: 0.05, // 5% daily interest
    });
    
    // Create daily quests
    await ctx.db.insert("dailyQuests", {
      userId,
      questType: "play_games",
      description: "Play 3 games",
      target: 3,
      progress: 0,
      reward: 100,
      completed: false,
      date: new Date().toISOString().split('T')[0],
    });
    
    return profileId;
  },
});

export const updateProfile = mutation({
  args: {
    username: v.optional(v.string()),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    
    if (!profile) throw new Error("Profile not found");
    
    const updates: any = {};
    
    if (args.username && args.username !== profile.username) {
      const existingProfile = await ctx.db
        .query("profiles")
        .withIndex("by_username", (q) => q.eq("username", args.username!))
        .first();
      
      if (existingProfile) {
        throw new Error("Username already taken");
      }
      updates.username = args.username;
    }
    
    if (args.avatar !== undefined) {
      updates.avatar = args.avatar;
    }
    
    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(profile._id, updates);
    }
    
    return profile._id;
  },
});

export const setOnlineStatus = mutation({
  args: {
    isOnline: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;
    
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    
    if (profile) {
      await ctx.db.patch(profile._id, {
        isOnline: args.isOnline,
        lastSeen: Date.now(),
      });
    }
  },
});

export const getLeaderboard = query({
  args: {},
  handler: async (ctx) => {
    const profiles = await ctx.db
      .query("profiles")
      .withIndex("by_level", (q) => q.gt("level", 0))
      .order("desc")
      .take(50);
    
    return profiles.map((profile, index) => ({
      ...profile,
      rank: index + 1,
    }));
  },
});
