import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

async function requireAdmin(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  
  const user = await ctx.db.get(userId);
  if (!user || user.email !== "admin@casino.com") {
    throw new Error("Admin access required");
  }
  
  return userId;
}

export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    
    const totalUsers = await ctx.db.query("profiles").collect();
    const onlineUsers = totalUsers.filter(p => p.isOnline);
    const activeTables = await ctx.db
      .query("gameTables")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
    
    const recentTransactions = await ctx.db
      .query("transactions")
      .order("desc")
      .take(100);
    
    const totalVolume = recentTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    return {
      totalUsers: totalUsers.length,
      onlineUsers: onlineUsers.length,
      activeTables: activeTables.length,
      totalVolume,
      recentTransactions: recentTransactions.slice(0, 20),
    };
  },
});

export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    
    const profiles = await ctx.db.query("profiles").collect();
    const usersWithWallets = [];
    
    for (const profile of profiles) {
      const wallet = await ctx.db
        .query("wallets")
        .withIndex("by_user", (q) => q.eq("userId", profile.userId))
        .unique();
      
      const user = await ctx.db.get(profile.userId);
      
      usersWithWallets.push({
        ...profile,
        wallet,
        balance: wallet?.balance || 0,
        email: user?.email || "N/A",
      });
    }
    
    return usersWithWallets;
  },
});

export const adjustUserBalance = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const adminId = await requireAdmin(ctx);
    
    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
    
    if (!wallet) throw new Error("Wallet not found");
    
    await ctx.db.patch(wallet._id, {
      balance: Math.max(0, wallet.balance + args.amount),
    });
    
    await ctx.db.insert("transactions", {
      userId: args.userId,
      type: args.amount > 0 ? "bonus" : "withdrawal",
      amount: args.amount,
      description: `Admin adjustment: ${args.reason}`,
    });
    
    await ctx.db.insert("adminLogs", {
      adminId,
      action: "balance_adjustment",
      targetUserId: args.userId,
      details: `Adjusted balance by ${args.amount}: ${args.reason}`,
      timestamp: Date.now(),
    });
    
    return wallet._id;
  },
});

export const createGameTable = mutation({
  args: {
    gameType: v.union(v.literal("roulette"), v.literal("blackjack")),
    name: v.string(),
    maxPlayers: v.number(),
    minBet: v.number(),
    maxBet: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    
    return await ctx.db.insert("gameTables", {
      gameType: args.gameType,
      name: args.name,
      maxPlayers: args.maxPlayers,
      minBet: args.minBet,
      maxBet: args.maxBet,
      isActive: true,
      gameState: {},
    });
  },
});

export const getRecentGames = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    
    return await ctx.db
      .query("games")
      .order("desc")
      .take(20);
  },
});

export const updateUserBalance = mutation({
  args: {
    userId: v.id("users"),
    newBalance: v.number(),
  },
  handler: async (ctx, args) => {
    const adminUserId = await requireAdmin(ctx);

    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (!wallet) throw new Error("Wallet not found");

    await ctx.db.patch(wallet._id, {
      balance: args.newBalance,
    });

    await ctx.db.insert("adminLogs", {
      adminId: adminUserId,
      action: "update_balance",
      targetUserId: args.userId,
      details: `Updated balance to ${args.newBalance}`,
      timestamp: Date.now(),
    });

    return wallet._id;
  },
});

export const getAdminLogs = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    
    return await ctx.db
      .query("adminLogs")
      .order("desc")
      .take(args.limit || 100);
  },
});
