import { mutation } from "./_generated/server";

export const initializeDefaultTables = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if tables already exist
    const existingTables = await ctx.db.query("gameTables").collect();
    if (existingTables.length > 0) {
      return "Tables already initialized";
    }
    
    // Create default roulette tables
    await ctx.db.insert("gameTables", {
      gameType: "roulette",
      name: "Roulette VIP",
      maxPlayers: 8,
      minBet: 100,
      maxBet: 5000,
      isActive: true,
      gameState: {},
    });
    
    await ctx.db.insert("gameTables", {
      gameType: "roulette",
      name: "Roulette Débutant",
      maxPlayers: 6,
      minBet: 10,
      maxBet: 500,
      isActive: true,
      gameState: {},
    });
    
    // Create default blackjack tables
    await ctx.db.insert("gameTables", {
      gameType: "blackjack",
      name: "Blackjack VIP",
      maxPlayers: 4,
      minBet: 100,
      maxBet: 2000,
      isActive: true,
      gameState: {},
    });
    
    await ctx.db.insert("gameTables", {
      gameType: "blackjack",
      name: "Blackjack Débutant",
      maxPlayers: 6,
      minBet: 10,
      maxBet: 500,
      isActive: true,
      gameState: {},
    });

    // Create poker tables
    await ctx.db.insert("gameTables", {
      gameType: "poker",
      name: "Poker Texas Hold'em VIP",
      maxPlayers: 8,
      minBet: 50,
      maxBet: 100,
      isActive: true,
      gameState: {},
    });

    await ctx.db.insert("gameTables", {
      gameType: "poker",
      name: "Poker Texas Hold'em Débutant",
      maxPlayers: 6,
      minBet: 10,
      maxBet: 20,
      isActive: true,
      gameState: {},
    });

    // Create slot machines
    await ctx.db.insert("gameTables", {
      gameType: "slots",
      name: "Lucky Sevens",
      maxPlayers: 1,
      minBet: 5,
      maxBet: 500,
      isActive: true,
      gameState: {},
    });

    await ctx.db.insert("gameTables", {
      gameType: "slots",
      name: "Diamond Dreams",
      maxPlayers: 1,
      minBet: 10,
      maxBet: 1000,
      isActive: true,
      gameState: {},
    });

    await ctx.db.insert("gameTables", {
      gameType: "slots",
      name: "Mega Fortune",
      maxPlayers: 1,
      minBet: 25,
      maxBet: 2500,
      isActive: true,
      gameState: {},
    });

    // Create baccarat tables
    await ctx.db.insert("gameTables", {
      gameType: "baccarat",
      name: "Baccarat Royal",
      maxPlayers: 8,
      minBet: 50,
      maxBet: 2000,
      isActive: true,
      gameState: {},
    });

    await ctx.db.insert("gameTables", {
      gameType: "baccarat",
      name: "Baccarat Express",
      maxPlayers: 6,
      minBet: 10,
      maxBet: 500,
      isActive: true,
      gameState: {},
    });
    
    return "All game tables created successfully";
  },
});
