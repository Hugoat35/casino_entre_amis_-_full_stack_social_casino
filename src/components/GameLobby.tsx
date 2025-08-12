import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { RouletteGame } from "./games/RouletteGame";
import { BlackjackGame } from "./games/BlackjackGame";
import { PokerGame } from "./games/PokerGame";
import { SlotsGame } from "./games/SlotsGame";
import { BaccaratGame } from "./games/BaccaratGame";
import { QuickGames } from "./games/QuickGames";

type GameView = "lobby" | "roulette" | "blackjack" | "poker" | "slots" | "baccarat" | "quick";

export function GameLobby() {
  const [currentView, setCurrentView] = useState<GameView>("lobby");
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  
  const rouletteTables = useQuery(api.games.roulette.getActiveTables) || [];
  const blackjackTables = useQuery(api.games.blackjack.getActiveTables) || [];
  const pokerTables = useQuery(api.games.poker.getActivePokerTables) || [];
  const slotMachines = useQuery(api.games.slots.getActiveSlotMachines) || [];
  const baccaratTables = useQuery(api.games.baccarat.getActiveBaccaratTables) || [];
  const initializeTables = useMutation(api.init.initializeDefaultTables);

  const handleInitializeTables = async () => {
    try {
      await initializeTables();
    } catch (error) {
      console.log("Tables already initialized or error:", error);
    }
  };

  const handleBackToLobby = () => {
    setCurrentView("lobby");
    setSelectedTableId(null);
  };

  // Game view routing
  if (currentView === "roulette" && selectedTableId) {
    return <RouletteGame tableId={selectedTableId as any} onBack={handleBackToLobby} />;
  }
  if (currentView === "blackjack" && selectedTableId) {
    return <BlackjackGame tableId={selectedTableId as any} onBack={handleBackToLobby} />;
  }
  if (currentView === "poker" && selectedTableId) {
    return <PokerGame tableId={selectedTableId as any} onBack={handleBackToLobby} />;
  }
  if (currentView === "slots" && selectedTableId) {
    return <SlotsGame tableId={selectedTableId as any} onBack={handleBackToLobby} />;
  }
  if (currentView === "baccarat" && selectedTableId) {
    return <BaccaratGame tableId={selectedTableId as any} onBack={handleBackToLobby} />;
  }
  if (currentView === "quick") {
    return <QuickGames onBack={handleBackToLobby} />;
  }
  
  const totalTables = rouletteTables.length + blackjackTables.length + pokerTables.length + slotMachines.length + baccaratTables.length;
  
  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Welcome Banner */}
      <div className="card-premium text-center">
        <h2 className="text-4xl font-bold gradient-text mb-4 animate-float">
          🎰 Casino Entre Amis - Multi-Jeux
        </h2>
        <p className="text-xl text-gray-300 mb-6">
          Découvrez notre collection complète de jeux de casino !
        </p>
        
        {totalTables === 0 && (
          <button
            onClick={handleInitializeTables}
            className="btn-gold px-8 py-4 text-lg"
          >
            🎲 Initialiser les jeux
          </button>
        )}
      </div>

      {/* Game Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Roulette */}
        <div className="card-premium group hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-center mb-4">
            <div className="text-5xl mr-4 animate-float">🎡</div>
            <div>
              <h3 className="text-2xl font-bold text-white glow-text">Roulette</h3>
              <p className="text-gray-300 text-sm">Pariez sur vos numéros favoris</p>
            </div>
          </div>
          
          <div className="space-y-3 mb-4">
            {rouletteTables.slice(0, 2).map((table) => (
              <button
                key={table._id}
                onClick={() => {
                  setSelectedTableId(table._id);
                  setCurrentView("roulette");
                }}
                className="w-full glass rounded-lg p-3 text-left hover:bg-white/10 transition-all"
              >
                <div className="flex justify-between items-center">
                  <span className="text-white font-medium">{table.name}</span>
                  <span className="text-green-400 text-sm">🟢 {table.minBet}-{table.maxBet}</span>
                </div>
              </button>
            ))}
          </div>
          
          <div className="text-center text-sm text-gray-400">
            {rouletteTables.length} table{rouletteTables.length > 1 ? 's' : ''} disponible{rouletteTables.length > 1 ? 's' : ''}
          </div>
        </div>

        {/* Blackjack */}
        <div className="card-premium group hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-center mb-4">
            <div className="text-5xl mr-4 animate-float">🃏</div>
            <div>
              <h3 className="text-2xl font-bold text-white glow-text">Blackjack</h3>
              <p className="text-gray-300 text-sm">Battez le croupier à 21</p>
            </div>
          </div>
          
          <div className="space-y-3 mb-4">
            {blackjackTables.slice(0, 2).map((table) => (
              <button
                key={table._id}
                onClick={() => {
                  setSelectedTableId(table._id);
                  setCurrentView("blackjack");
                }}
                className="w-full glass rounded-lg p-3 text-left hover:bg-white/10 transition-all"
              >
                <div className="flex justify-between items-center">
                  <span className="text-white font-medium">{table.name}</span>
                  <span className="text-green-400 text-sm">🟢 {table.minBet}-{table.maxBet}</span>
                </div>
              </button>
            ))}
          </div>
          
          <div className="text-center text-sm text-gray-400">
            {blackjackTables.length} table{blackjackTables.length > 1 ? 's' : ''} disponible{blackjackTables.length > 1 ? 's' : ''}
          </div>
        </div>

        {/* Poker */}
        <div className="card-premium group hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-center mb-4">
            <div className="text-5xl mr-4 animate-float">♠️</div>
            <div>
              <h3 className="text-2xl font-bold text-white glow-text">Poker</h3>
              <p className="text-gray-300 text-sm">Texas Hold'em multi-joueurs</p>
            </div>
          </div>
          
          <div className="space-y-3 mb-4">
            {pokerTables.slice(0, 2).map((table) => (
              <button
                key={table._id}
                onClick={() => {
                  setSelectedTableId(table._id);
                  setCurrentView("poker");
                }}
                className="w-full glass rounded-lg p-3 text-left hover:bg-white/10 transition-all"
              >
                <div className="flex justify-between items-center">
                  <span className="text-white font-medium">{table.name}</span>
                  <span className="text-green-400 text-sm">🟢 {table.minBet}/{table.maxBet}</span>
                </div>
              </button>
            ))}
          </div>
          
          <div className="text-center text-sm text-gray-400">
            {pokerTables.length} table{pokerTables.length > 1 ? 's' : ''} disponible{pokerTables.length > 1 ? 's' : ''}
          </div>
        </div>

        {/* Slots */}
        <div className="card-premium group hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-center mb-4">
            <div className="text-5xl mr-4 animate-float">🎰</div>
            <div>
              <h3 className="text-2xl font-bold text-white glow-text">Machines à Sous</h3>
              <p className="text-gray-300 text-sm">Jackpots et lignes gagnantes</p>
            </div>
          </div>
          
          <div className="space-y-3 mb-4">
            {slotMachines.slice(0, 2).map((machine) => (
              <button
                key={machine._id}
                onClick={() => {
                  setSelectedTableId(machine._id);
                  setCurrentView("slots");
                }}
                className="w-full glass rounded-lg p-3 text-left hover:bg-white/10 transition-all"
              >
                <div className="flex justify-between items-center">
                  <span className="text-white font-medium">{machine.name}</span>
                  <span className="text-green-400 text-sm">🟢 {machine.minBet}-{machine.maxBet}</span>
                </div>
              </button>
            ))}
          </div>
          
          <div className="text-center text-sm text-gray-400">
            {slotMachines.length} machine{slotMachines.length > 1 ? 's' : ''} disponible{slotMachines.length > 1 ? 's' : ''}
          </div>
        </div>

        {/* Baccarat */}
        <div className="card-premium group hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-center mb-4">
            <div className="text-5xl mr-4 animate-float">🎴</div>
            <div>
              <h3 className="text-2xl font-bold text-white glow-text">Baccarat</h3>
              <p className="text-gray-300 text-sm">Joueur, Banque ou Égalité</p>
            </div>
          </div>
          
          <div className="space-y-3 mb-4">
            {baccaratTables.slice(0, 2).map((table) => (
              <button
                key={table._id}
                onClick={() => {
                  setSelectedTableId(table._id);
                  setCurrentView("baccarat");
                }}
                className="w-full glass rounded-lg p-3 text-left hover:bg-white/10 transition-all"
              >
                <div className="flex justify-between items-center">
                  <span className="text-white font-medium">{table.name}</span>
                  <span className="text-green-400 text-sm">🟢 {table.minBet}-{table.maxBet}</span>
                </div>
              </button>
            ))}
          </div>
          
          <div className="text-center text-sm text-gray-400">
            {baccaratTables.length} table{baccaratTables.length > 1 ? 's' : ''} disponible{baccaratTables.length > 1 ? 's' : ''}
          </div>
        </div>

        {/* Quick Games */}
        <div className="card-premium group hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-center mb-4">
            <div className="text-5xl mr-4 animate-float">⚡</div>
            <div>
              <h3 className="text-2xl font-bold text-white glow-text">Jeux Rapides</h3>
              <p className="text-gray-300 text-sm">Action instantanée</p>
            </div>
          </div>
          
          <div className="space-y-3 mb-4">
            <button
              onClick={() => setCurrentView("quick")}
              className="w-full glass rounded-lg p-3 text-left hover:bg-white/10 transition-all"
            >
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-2xl">🪙</div>
                  <div className="text-xs text-gray-400">Pile/Face</div>
                </div>
                <div>
                  <div className="text-2xl">📊</div>
                  <div className="text-xs text-gray-400">Haut/Bas</div>
                </div>
                <div>
                  <div className="text-2xl">🎡</div>
                  <div className="text-xs text-gray-400">Roue</div>
                </div>
              </div>
            </button>
          </div>
          
          <div className="text-center text-sm text-gray-400">
            3 mini-jeux disponibles
          </div>
        </div>
      </div>
      
      {/* Quick Stats */}
      <div className="card-premium">
        <h2 className="text-3xl font-bold text-white mb-6 flex items-center glow-text">
          <span className="mr-3 animate-float">📈</span>
          Statistiques du Casino
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {[
            { icon: "🎡", value: rouletteTables.length, label: "Tables Roulette", color: "text-red-400" },
            { icon: "🃏", value: blackjackTables.length, label: "Tables Blackjack", color: "text-blue-400" },
            { icon: "♠️", value: pokerTables.length, label: "Tables Poker", color: "text-green-400" },
            { icon: "🎰", value: slotMachines.length, label: "Machines à Sous", color: "text-yellow-400" },
            { icon: "🎴", value: baccaratTables.length, label: "Tables Baccarat", color: "text-purple-400" },
            { icon: "⚡", value: 3, label: "Jeux Rapides", color: "text-orange-400" },
          ].map((stat, index) => (
            <div key={index} className="text-center glass rounded-xl p-4 hover:scale-105 transition-all duration-300">
              <div className="text-3xl mb-2 animate-float" style={{ animationDelay: `${index * 0.2}s` }}>
                {stat.icon}
              </div>
              <div className={`text-2xl font-bold ${stat.color} mb-1`}>
                {stat.value}
              </div>
              <div className="text-xs text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
