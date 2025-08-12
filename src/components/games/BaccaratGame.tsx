import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../../convex/_generated/dataModel";
import { AnimatedCard } from "../ui/AnimatedCard";
import { ParticleEffect } from "../ui/ParticleEffect";

interface BaccaratGameProps {
  tableId: Id<"gameTables">;
  onBack: () => void;
}

export function BaccaratGame({ tableId, onBack }: BaccaratGameProps) {
  const [bet, setBet] = useState(10);
  const [betType, setBetType] = useState<"player" | "banker" | "tie">("player");
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameResult, setGameResult] = useState<any>(null);
  const [showParticles, setShowParticles] = useState(false);
  const [particleOrigin, setParticleOrigin] = useState({ x: 0, y: 0 });
  
  const table = useQuery(api.games.baccarat.getActiveBaccaratTables)?.find(t => t._id === tableId);
  const wallet = useQuery(api.banking.getWallet);
  const placeBet = useMutation(api.games.baccarat.placeBaccaratBet);

  const handlePlaceBet = async () => {
    if (!table || isPlaying) return;
    
    setIsPlaying(true);
    setGameResult(null);
    
    try {
      const result = await placeBet({
        tableId,
        betType,
        amount: bet,
      });
      
      setTimeout(() => {
        setGameResult(result);
        setIsPlaying(false);
        
        if (result.payout > 0) {
          setParticleOrigin({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
          setShowParticles(true);
          setTimeout(() => setShowParticles(false), 100);
          
          toast.success(`Victoire! Vous avez gagné ${result.payout} jetons!`);
        } else {
          toast.info("Pas de chance cette fois!");
        }
      }, 2000);
      
    } catch (error) {
      setIsPlaying(false);
      toast.error(error instanceof Error ? error.message : "Erreur");
    }
  };

  if (!table) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p>Chargement de la table de Baccarat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <ParticleEffect 
        trigger={showParticles} 
        origin={particleOrigin}
        count={30}
      />
      
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors btn-premium"
          >
            <span>←</span>
            <span>Retour au lobby</span>
          </button>
          
          <h1 className="text-4xl font-bold text-white flex items-center gradient-text">
            <span className="mr-2 animate-float">🎴</span>
            {table.name}
          </h1>
          
          <div className="text-right">
            <div className="text-white font-bold text-lg">
              💰 {wallet?.balance?.toLocaleString() || 0} jetons
            </div>
            <div className="text-sm text-gray-400">
              Mise: {table.minBet} - {table.maxBet} jetons
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Game Table */}
        <div className="table-felt rounded-2xl p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Player Side */}
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-4">Joueur</h3>
              <div className="flex justify-center space-x-2 mb-4 min-h-[100px]">
                {gameResult?.playerCards?.map((card: any, index: number) => (
                  <AnimatedCard
                    key={index}
                    suit={card.suit}
                    rank={card.rank}
                    className={isPlaying ? 'animate-card-flip' : ''}
                  />
                )) || (isPlaying && [1, 2].map(i => (
                  <AnimatedCard
                    key={i}
                    suit="hearts"
                    rank="A"
                    hidden={true}
                    className="animate-card-flip"
                  />
                )))}
              </div>
              {gameResult && (
                <div className="text-xl font-bold text-yellow-400">
                  Valeur: {gameResult.playerValue}
                </div>
              )}
            </div>
            
            {/* Banker Side */}
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-4">Banque</h3>
              <div className="flex justify-center space-x-2 mb-4 min-h-[100px]">
                {gameResult?.bankerCards?.map((card: any, index: number) => (
                  <AnimatedCard
                    key={index}
                    suit={card.suit}
                    rank={card.rank}
                    className={isPlaying ? 'animate-card-flip' : ''}
                  />
                )) || (isPlaying && [1, 2].map(i => (
                  <AnimatedCard
                    key={i}
                    suit="hearts"
                    rank="A"
                    hidden={true}
                    className="animate-card-flip"
                  />
                )))}
              </div>
              {gameResult && (
                <div className="text-xl font-bold text-yellow-400">
                  Valeur: {gameResult.bankerValue}
                </div>
              )}
            </div>
          </div>
          
          {/* Result */}
          {gameResult && (
            <div className="text-center mt-8">
              <div className="text-3xl font-bold text-white mb-2">
                Gagnant: {
                  gameResult.winner === "player" ? "🎯 Joueur" :
                  gameResult.winner === "banker" ? "🏦 Banque" : "🤝 Égalité"
                }
              </div>
              {gameResult.payout > 0 && (
                <div className="text-2xl font-bold text-green-400">
                  Gain: {gameResult.payout} jetons!
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Betting Controls */}
        <div className="card-premium">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">Placer votre mise</h3>
          
          <div className="space-y-6">
            {/* Bet Type Selection */}
            <div>
              <h4 className="text-lg font-bold text-white mb-4 text-center">Type de pari</h4>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { key: "player", label: "🎯 Joueur", payout: "1:1" },
                  { key: "banker", label: "🏦 Banque", payout: "1:0.95" },
                  { key: "tie", label: "🤝 Égalité", payout: "8:1" },
                ].map((option) => (
                  <button
                    key={option.key}
                    onClick={() => setBetType(option.key as any)}
                    disabled={isPlaying}
                    className={`p-4 rounded-xl font-bold transition-all duration-300 ${
                      betType === option.key
                        ? 'bg-yellow-500 text-black scale-105'
                        : 'bg-white/10 text-white hover:bg-white/20 hover:scale-105'
                    } disabled:opacity-50`}
                  >
                    <div className="text-lg">{option.label}</div>
                    <div className="text-sm opacity-75">{option.payout}</div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Bet Amount */}
            <div>
              <h4 className="text-lg font-bold text-white mb-4 text-center">Montant de la mise</h4>
              <div className="flex justify-center space-x-4">
                {[10, 25, 50, 100, 250, 500].map((value) => (
                  <button
                    key={value}
                    onClick={() => setBet(value)}
                    disabled={!wallet || wallet.balance < value || isPlaying}
                    className={`px-4 py-2 rounded-lg font-bold transition-all duration-300 ${
                      bet === value
                        ? 'bg-yellow-500 text-black scale-110'
                        : 'bg-white/10 text-white hover:bg-white/20 hover:scale-105'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {value} 🪙
                  </button>
                ))}
              </div>
            </div>
            
            {/* Place Bet Button */}
            <div className="text-center">
              <button
                onClick={handlePlaceBet}
                disabled={isPlaying || !wallet || wallet.balance < bet}
                className="btn-gold px-12 py-4 text-xl font-bold"
              >
                {isPlaying ? "🎴 Distribution..." : `🎲 Miser ${bet} jetons sur ${betType}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
