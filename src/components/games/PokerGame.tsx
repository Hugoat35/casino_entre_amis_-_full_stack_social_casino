import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../../convex/_generated/dataModel";
import { AnimatedCard } from "../ui/AnimatedCard";
import { ParticleEffect } from "../ui/ParticleEffect";
import { ChipStack } from "../ui/ChipStack";

interface PokerGameProps {
  tableId: Id<"gameTables">;
  onBack: () => void;
}

type Card = {
  suit: "hearts" | "diamonds" | "clubs" | "spades";
  rank: "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";
  value: number;
};

export function PokerGame({ tableId, onBack }: PokerGameProps) {
  const [buyIn, setBuyIn] = useState(1000);
  const [currentBet, setCurrentBet] = useState(0);
  const [hasJoined, setHasJoined] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [particleOrigin, setParticleOrigin] = useState({ x: 0, y: 0 });
  
  const table = useQuery(api.games.poker.getActivePokerTables)?.find(t => t._id === tableId);
  const currentGame = useQuery(api.games.poker.getCurrentPokerGame, { tableId });
  const wallet = useQuery(api.banking.getWallet);
  
  const joinTable = useMutation(api.games.poker.joinPokerTable);
  const placeBet = useMutation(api.games.poker.placeBet);
  const fold = useMutation(api.games.poker.fold);
  const call = useMutation(api.games.poker.call);
  const raise = useMutation(api.games.poker.raise);

  const handleJoinTable = async () => {
    try {
      await joinTable({ tableId, buyIn });
      setHasJoined(true);
      toast.success(`Rejoint la table avec ${buyIn} jetons!`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    }
  };

  const handleAction = async (action: "fold" | "call" | "raise", amount?: number) => {
    try {
      switch (action) {
        case "fold":
          await fold({ gameId: currentGame!._id });
          break;
        case "call":
          await call({ gameId: currentGame!._id });
          break;
        case "raise":
          await raise({ gameId: currentGame!._id, amount: amount || currentBet });
          break;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    }
  };

  if (!table) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p>Chargement de la table de poker...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900 p-4">
      <ParticleEffect 
        trigger={showParticles} 
        origin={particleOrigin}
        count={30}
      />
      
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors btn-premium"
          >
            <span>←</span>
            <span>Retour au lobby</span>
          </button>
          
          <h1 className="text-4xl font-bold text-white flex items-center gradient-text">
            <span className="mr-2 animate-float">♠️</span>
            {table.name} - Texas Hold'em
          </h1>
          
          <div className="text-right">
            <div className="text-white font-bold text-lg">
              💰 {wallet?.balance?.toLocaleString() || 0} jetons
            </div>
            <div className="text-sm text-gray-400">
              Blinds: {table.minBet}/{table.maxBet}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {!hasJoined || !currentGame ? (
          /* Join Table Interface */
          <div className="card-premium text-center max-w-2xl mx-auto">
            <h3 className="text-3xl font-bold text-white mb-6 glow-text">
              Rejoindre la table de poker
            </h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-bold text-white mb-4">Buy-in (jetons d'entrée)</h4>
                <div className="flex justify-center space-x-4">
                  {[500, 1000, 2000, 5000].map((value) => (
                    <button
                      key={value}
                      onClick={() => setBuyIn(value)}
                      disabled={!wallet || wallet.balance < value}
                      className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
                        buyIn === value
                          ? 'bg-green-500 text-white scale-110'
                          : 'bg-white/10 text-white hover:bg-white/20 hover:scale-105'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {value} 🪙
                    </button>
                  ))}
                </div>
              </div>
              
              <button
                onClick={handleJoinTable}
                disabled={!wallet || wallet.balance < buyIn}
                className="btn-gold px-12 py-4 text-xl font-bold"
              >
                🎲 Rejoindre la table ({buyIn} jetons)
              </button>
            </div>
          </div>
        ) : (
          /* Poker Table Interface */
          <div className="space-y-8">
            {/* Community Cards */}
            <div className="card-premium text-center">
              <h3 className="text-2xl font-bold text-white mb-4">Cartes communes</h3>
              <div className="flex justify-center space-x-2 mb-4">
                {currentGame.gameState?.communityCards?.map((card: Card, index: number) => (
                  <AnimatedCard
                    key={index}
                    suit={card.suit}
                    rank={card.rank}
                    className="animate-card-flip"
                  />
                )) || Array(5).fill(0).map((_, i) => (
                  <AnimatedCard
                    key={i}
                    suit="hearts"
                    rank="A"
                    hidden={true}
                  />
                ))}
              </div>
              <div className="text-xl font-bold text-yellow-400">
                Pot: {currentGame.gameState?.pot?.toLocaleString() || 0} jetons
              </div>
            </div>

            {/* Player's Hand */}
            <div className="card-premium text-center">
              <h3 className="text-2xl font-bold text-white mb-4">Votre main</h3>
              <div className="flex justify-center space-x-2 mb-4">
                {currentGame.gameState?.players?.find((p: any) => p.userId === wallet?.userId)?.cards?.map((card: Card, index: number) => (
                  <AnimatedCard
                    key={index}
                    suit={card.suit}
                    rank={card.rank}
                  />
                )) || Array(2).fill(0).map((_, i) => (
                  <AnimatedCard
                    key={i}
                    suit="hearts"
                    rank="A"
                    hidden={true}
                  />
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="card-premium">
              <h3 className="text-2xl font-bold text-white mb-6 text-center">Actions</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => handleAction("fold")}
                  className="btn-premium bg-red-600 hover:bg-red-700 py-4"
                >
                  🚫 Se coucher
                </button>
                
                <button
                  onClick={() => handleAction("call")}
                  className="btn-premium bg-blue-600 hover:bg-blue-700 py-4"
                >
                  📞 Suivre
                </button>
                
                <div className="space-y-2">
                  <input
                    type="number"
                    value={currentBet}
                    onChange={(e) => setCurrentBet(Number(e.target.value))}
                    min={table.minBet}
                    max={table.maxBet}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20"
                    placeholder="Montant"
                  />
                  <button
                    onClick={() => handleAction("raise", currentBet)}
                    disabled={currentBet < table.minBet}
                    className="w-full btn-premium bg-green-600 hover:bg-green-700 py-2"
                  >
                    📈 Relancer
                  </button>
                </div>
              </div>
            </div>

            {/* Players at Table */}
            <div className="card-premium">
              <h3 className="text-2xl font-bold text-white mb-4">Joueurs à la table</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {currentGame.gameState?.players?.map((player: any, index: number) => (
                  <div key={index} className="glass rounded-lg p-4 text-center">
                    <div className="text-lg font-bold text-white mb-2">
                      Joueur {index + 1}
                    </div>
                    <div className="text-yellow-400 font-bold">
                      {player.chips} jetons
                    </div>
                    <div className="text-sm text-gray-400">
                      {player.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
