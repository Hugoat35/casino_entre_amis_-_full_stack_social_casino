import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const coinFlip = mutation({
  args: {
    bet: v.number(),
    choice: v.union(v.literal("heads"), v.literal("tails")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    
    if (!wallet) throw new Error("Wallet not found");
    if (wallet.balance < args.bet) throw new Error("Insufficient balance");
    if (args.bet < 1 || args.bet > 1000) throw new Error("Bet must be between 1 and 1000");
    
    // Deduct bet
    await ctx.db.patch(wallet._id, {
      balance: wallet.balance - args.bet,
    });
    
    await ctx.db.insert("transactions", {
      userId,
      type: "bet",
      amount: -args.bet,
      description: "Coin flip bet",
    });
    
    // Generate result
    const result = Math.random() < 0.5 ? "heads" : "tails";
    const won = result === args.choice;
    const payout = won ? args.bet * 2 : 0;
    
    if (payout > 0) {
      await ctx.db.patch(wallet._id, {
        balance: wallet.balance + payout,
      });
      
      await ctx.db.insert("transactions", {
        userId,
        type: "win",
        amount: payout,
        description: `Coin flip win: ${result}`,
      });
    }
    
    return { result, won, payout };
  },
});

export const highLow = mutation({
  args: {
    bet: v.number(),
    choice: v.union(v.literal("high"), v.literal("low")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    
    if (!wallet) throw new Error("Wallet not found");
    if (wallet.balance < args.bet) throw new Error("Insufficient balance");
    
    // Deduct bet
    await ctx.db.patch(wallet._id, {
      balance: wallet.balance - args.bet,
    });
    
    await ctx.db.insert("transactions", {
      userId,
      type: "bet",
      amount: -args.bet,
      description: "High/Low bet",
    });
    
    // Generate number 1-100
    const number = Math.floor(Math.random() * 100) + 1;
    const isHigh = number > 50;
    const won = (args.choice === "high" && isHigh) || (args.choice === "low" && !isHigh);
    const payout = won ? args.bet * 1.9 : 0; // Slightly less than 2x for house edge
    
    if (payout > 0) {
      await ctx.db.patch(wallet._id, {
        balance: wallet.balance + payout,
      });
      
      await ctx.db.insert("transactions", {
        userId,
        type: "win",
        amount: payout,
        description: `High/Low win: ${number}`,
      });
    }
    
    return { number, won, payout };
  },
});

export const dailyWheel = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    
    if (!profile) throw new Error("Profile not found");
    
    // Check if already spun today
    const today = new Date().toDateString();
    const lastSpin = profile.lastDailyBonus ? new Date(profile.lastDailyBonus).toDateString() : null;
    
    if (lastSpin === today) {
      throw new Error("Daily wheel already spun today");
    }
    
    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    
    if (!wallet) throw new Error("Wallet not found");
    
    // Wheel segments with different probabilities
    const segments = [
      { prize: 50, weight: 30 },
      { prize: 100, weight: 25 },
      { prize: 200, weight: 20 },
      { prize: 500, weight: 15 },
      { prize: 1000, weight: 8 },
      { prize: 2500, weight: 2 },
    ];
    
    const random = Math.random() * 100;
    let totalWeight = 0;
    let prize = 50;
    
    for (const segment of segments) {
      totalWeight += segment.weight;
      if (random <= totalWeight) {
        prize = segment.prize;
        break;
      }
    }
    
    // Award prize
    await ctx.db.patch(wallet._id, {
      balance: wallet.balance + prize,
    });
    
    await ctx.db.patch(profile._id, {
      lastDailyBonus: Date.now(),
    });
    
    await ctx.db.insert("transactions", {
      userId,
      type: "bonus",
      amount: prize,
      description: `Daily wheel prize: ${prize}`,
    });
    
    return { prize };
  },
});
