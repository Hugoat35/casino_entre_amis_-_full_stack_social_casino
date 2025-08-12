import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  // User profiles and game data
  profiles: defineTable({
    userId: v.id("users"),
    username: v.string(),
    avatar: v.optional(v.string()),
    level: v.number(),
    xp: v.number(),
    totalWinnings: v.number(),
    totalLosses: v.number(),
    gamesPlayed: v.number(),
    lastDailyBonus: v.optional(v.number()),
    isOnline: v.boolean(),
    lastSeen: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_username", ["username"])
    .index("by_level", ["level"]),

  // Virtual currency and banking
  wallets: defineTable({
    userId: v.id("users"),
    balance: v.number(),
    vault: v.number(),
    vaultInterestRate: v.number(),
    lastInterestClaim: v.optional(v.number()),
  }).index("by_user", ["userId"]),

  transactions: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("deposit"),
      v.literal("withdrawal"),
      v.literal("bet"),
      v.literal("win"),
      v.literal("bonus"),
      v.literal("interest"),
      v.literal("loan"),
      v.literal("transfer"),
      v.literal("friend_bet"),
      v.literal("friend_bet_win")
    ),
    amount: v.number(),
    description: v.string(),
    gameId: v.optional(v.id("games")),
    relatedUserId: v.optional(v.id("users")),
  }).index("by_user", ["userId"]),

  // Friends and social
  friendships: defineTable({
    requesterId: v.id("users"),
    addresseeId: v.id("users"),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("blocked")),
  })
    .index("by_requester", ["requesterId"])
    .index("by_addressee", ["addresseeId"]),

  // Friend betting system
  friendBets: defineTable({
    bettorId: v.id("users"),
    targetId: v.id("users"),
    gameId: v.id("games"),
    tableId: v.id("gameTables"),
    roundId: v.string(),
    betType: v.union(v.literal("gains"), v.literal("losses")),
    stake: v.number(),
    multiplier: v.number(),
    status: v.union(v.literal("active"), v.literal("won"), v.literal("lost"), v.literal("cancelled")),
    targetStartBalance: v.number(),
    targetEndBalance: v.optional(v.number()),
    payout: v.optional(v.number()),
    resolvedAt: v.optional(v.number()),
  })
    .index("by_bettor", ["bettorId"])
    .index("by_target", ["targetId"])
    .index("by_game", ["gameId"])
    .index("by_round", ["roundId"])
    .index("by_status", ["status"]),

  // Friend betting settings (admin configurable)
  friendBetSettings: defineTable({
    isEnabled: v.boolean(),
    minStake: v.number(),
    maxStake: v.number(),
    gainsMultiplier: v.number(),
    lossesMultiplier: v.number(),
    cooldownMinutes: v.number(),
    maxActiveBetsPerUser: v.number(),
  }),

  // Chat system
  chatMessages: defineTable({
    senderId: v.id("users"),
    type: v.union(v.literal("global"), v.literal("table"), v.literal("private")),
    content: v.string(),
    tableId: v.optional(v.id("gameTables")),
    recipientId: v.optional(v.id("users")),
  })
    .index("by_type", ["type"])
    .index("by_table", ["tableId"])
    .index("by_private", ["senderId", "recipientId"]),

  // Game tables and sessions - Updated for multi-game support
  gameTables: defineTable({
    gameType: v.union(
      v.literal("roulette"), 
      v.literal("blackjack"), 
      v.literal("poker"),
      v.literal("slots"),
      v.literal("baccarat")
    ),
    name: v.string(),
    maxPlayers: v.number(),
    minBet: v.number(),
    maxBet: v.number(),
    isActive: v.boolean(),
    currentRound: v.optional(v.string()),
    roundStartTime: v.optional(v.number()),
    roundEndTime: v.optional(v.number()),
    gameState: v.any(), // Game-specific state
  })
    .index("by_type", ["gameType"])
    .index("by_active", ["isActive"]),

  // Game sessions and results - Updated for multi-game support
  games: defineTable({
    tableId: v.id("gameTables"),
    gameType: v.union(
      v.literal("roulette"), 
      v.literal("blackjack"), 
      v.literal("poker"),
      v.literal("slots"),
      v.literal("baccarat")
    ),
    players: v.array(v.id("users")),
    spectators: v.array(v.id("users")),
    bets: v.array(v.object({
      userId: v.id("users"),
      amount: v.number(),
      betType: v.string(),
      betValue: v.any(),
    })),
    result: v.optional(v.any()),
    status: v.union(v.literal("waiting"), v.literal("betting"), v.literal("playing"), v.literal("finished")),
    roundNumber: v.number(),
    seed: v.string(), // For verifiable randomness
    gameState: v.optional(v.any()), // Additional game-specific state
  })
    .index("by_table", ["tableId"])
    .index("by_status", ["status"]),

  // Achievements and progression
  achievements: defineTable({
    userId: v.id("users"),
    type: v.string(),
    name: v.string(),
    description: v.string(),
    reward: v.number(),
    unlockedAt: v.number(),
  }).index("by_user", ["userId"]),

  // Daily quests
  dailyQuests: defineTable({
    userId: v.id("users"),
    questType: v.string(),
    description: v.string(),
    target: v.number(),
    progress: v.number(),
    reward: v.number(),
    completed: v.boolean(),
    date: v.string(), // YYYY-MM-DD format
  })
    .index("by_user_date", ["userId", "date"])
    .index("by_user", ["userId"]),

  // Tournaments and events - Enhanced for multi-game support
  tournaments: defineTable({
    name: v.string(),
    gameType: v.union(
      v.literal("roulette"), 
      v.literal("blackjack"), 
      v.literal("poker"),
      v.literal("slots"),
      v.literal("baccarat"),
      v.literal("multi") // Multi-game tournaments
    ),
    entryFee: v.number(),
    prizePool: v.number(),
    maxParticipants: v.number(),
    startTime: v.number(),
    endTime: v.number(),
    status: v.union(v.literal("upcoming"), v.literal("active"), v.literal("finished")),
    participants: v.array(v.id("users")),
    leaderboard: v.array(v.object({
      userId: v.id("users"),
      score: v.number(),
      position: v.number(),
    })),
  })
    .index("by_status", ["status"])
    .index("by_start_time", ["startTime"]),

  // Admin logs
  adminLogs: defineTable({
    adminId: v.id("users"),
    action: v.string(),
    targetUserId: v.optional(v.id("users")),
    details: v.string(),
    timestamp: v.number(),
  }).index("by_admin", ["adminId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
