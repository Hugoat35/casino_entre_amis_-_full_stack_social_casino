import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getWallet = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    
    return await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
  },
});

export const claimDailyBonus = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    
    if (!profile) throw new Error("Profile not found");
    
    const today = new Date().toDateString();
    const lastBonus = profile.lastDailyBonus ? new Date(profile.lastDailyBonus).toDateString() : null;
    
    if (lastBonus === today) {
      throw new Error("Daily bonus already claimed today");
    }
    
    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    
    if (!wallet) throw new Error("Wallet not found");
    
    const bonusAmount = 200 + (profile.level * 10); // Base bonus + level bonus
    
    // Update wallet
    await ctx.db.patch(wallet._id, {
      balance: wallet.balance + bonusAmount,
    });
    
    // Update profile
    await ctx.db.patch(profile._id, {
      lastDailyBonus: Date.now(),
    });
    
    // Record transaction
    await ctx.db.insert("transactions", {
      userId,
      type: "bonus",
      amount: bonusAmount,
      description: `Daily bonus (Level ${profile.level})`,
    });
    
    return bonusAmount;
  },
});

export const depositToVault = mutation({
  args: {
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    if (args.amount <= 0) throw new Error("Invalid amount");
    
    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    
    if (!wallet) throw new Error("Wallet not found");
    if (wallet.balance < args.amount) throw new Error("Insufficient balance");
    
    await ctx.db.patch(wallet._id, {
      balance: wallet.balance - args.amount,
      vault: wallet.vault + args.amount,
    });
    
    await ctx.db.insert("transactions", {
      userId,
      type: "deposit",
      amount: args.amount,
      description: "Deposit to vault",
    });
    
    return wallet._id;
  },
});

export const withdrawFromVault = mutation({
  args: {
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    if (args.amount <= 0) throw new Error("Invalid amount");
    
    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    
    if (!wallet) throw new Error("Wallet not found");
    if (wallet.vault < args.amount) throw new Error("Insufficient vault balance");
    
    await ctx.db.patch(wallet._id, {
      balance: wallet.balance + args.amount,
      vault: wallet.vault - args.amount,
    });
    
    await ctx.db.insert("transactions", {
      userId,
      type: "withdrawal",
      amount: args.amount,
      description: "Withdrawal from vault",
    });
    
    return wallet._id;
  },
});

export const claimVaultInterest = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    
    if (!wallet) throw new Error("Wallet not found");
    
    const lastClaim = wallet.lastInterestClaim || 0;
    const now = Date.now();
    const daysSinceLastClaim = Math.floor((now - lastClaim) / (24 * 60 * 60 * 1000));
    
    if (daysSinceLastClaim < 1) {
      throw new Error("Interest can only be claimed once per day");
    }
    
    const interest = Math.floor(wallet.vault * wallet.vaultInterestRate * daysSinceLastClaim);
    
    if (interest > 0) {
      await ctx.db.patch(wallet._id, {
        balance: wallet.balance + interest,
        lastInterestClaim: now,
      });
      
      await ctx.db.insert("transactions", {
        userId,
        type: "interest",
        amount: interest,
        description: `Vault interest (${daysSinceLastClaim} days)`,
      });
    }
    
    return interest;
  },
});

export const getTransactionHistory = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    
    return await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(args.limit || 50);
  },
});
