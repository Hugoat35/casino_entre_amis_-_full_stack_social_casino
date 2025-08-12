import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../../convex/_generated/dataModel";
import { RouletteWheel } from "./RouletteWheel";
import { BettingBoard } from "./BettingBoard";
import { ChipStack } from "../ui/ChipStack";
import { ParticleEffect } from "../ui/ParticleEffect";
import { SoundToggle } from "../ui/SoundToggle";

interface RouletteGameProps {
  tableId: Id<"gameTables">;
  onBack: () => void;
}

const CHIP_VALUES = [5, 10, 25, 50, 100, 250, 500];

export function RouletteGame({ tableId, onBack }: RouletteGameProps) {
  const [selectedBets, setSelectedBets] = useState<Record<string, number>>({});
  const [selectedChip, setSelectedChip] = useState(10);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [particleOrigin, setParticleOrigin] = useState({ x: 0, y: 0 });
  
  const table = useQuery(api.games.roulette.getActiveTables)?.find(t => t._id === tableId);
  const currentGame = useQuery(api.games.roulette.getCurrentGame, { tableId });
  const wallet = useQuery(api.banking.getWallet);
  
  const joinTable = useMutation(api.games.roulette.joinTable);
  const placeBet = useMutation(api.games.roulette.placeBet);
  const spinRoulette = useMutation(api.games.roulette.spinRoulette);

  useEffect(() => {
    if (table && !currentGame) {
      joinTable({ tableId });
    }
  }, [table, currentGame, joinTable, tableId]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setSelectedBets({});
      setIsSpinning(false);
    };
  }, []);

  const handlePlaceBet = async (betType: string, betValue: any) => {
    if (!currentGame || currentGame.status !== "betting") {
      toast.error("Les mises ne sont pas ouvertes");
      return;
    }

    try {
      await placeBet({
        gameId: currentGame._id,
        amount: selectedChip,
        betType,
        betValue,
      });
      
      const betKey = betType === 'straight' ? `${betType}-${betValue}` : betType;
      setSelectedBets(prev => ({
        ...prev,
        [betKey]: (prev[betKey] || 0) + selectedChip,
      }));
      
      toast.success(`Mise de ${selectedChip} jetons placée sur ${betType === 'straight' ? `le ${betValue}` : betType}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    }
  };

  const handleSpin = async () => {
    if (!currentGame) return;
    
    setIsSpinning(true);
    try {
      const result = await spinRoulette({ gameId: currentGame._id });
      
      // Show particles on win
      if (Object.keys(selectedBets).length > 0) {
        setParticleOrigin({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
        setShowParticles(true);
        setTimeout(() => setShowParticles(false), 100);
      }
      
      setTimeout(() => {
        setIsSpinning(false);
        setSelectedBets({});
        toast.success(
          `Résultat: ${result.number} ${result.color === "red" ? "🔴" : result.color === "black" ? "⚫" : "🟢"}`,
          { duration: 5000 }
        );
      }, 3000);
    } catch (error) {
      setIsSpinning(false);
      toast.error(error instanceof Error ? error.message : "Erreur");
    }
  };

  if (!table) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p>Chargement de la table...</p>
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
            <span className="mr-2 animate-float">🎡</span>
            {table.name}
          </h1>
          
          <div className="flex items-center space-x-4">
            <SoundToggle />
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
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Roulette Wheel */}
        <div className="lg:col-span-1">
          <div className="card-premium text-center">
            <h3 className="text-2xl font-bold text-white mb-6 glow-text">Roulette</h3>
            
            <RouletteWheel 
              isSpinning={isSpinning}
              result={currentGame?.result?.number}
              onSpinComplete={() => {}}
            />
            
            {/* Game Status */}
            <div className="mt-6 space-y-4">
              {currentGame?.status === "betting" && (
                <div className="text-center">
                  <div className="text-green-400 font-bold text-lg animate-pulse">
                    🟢 Mises ouvertes
                  </div>
                  <button
                    onClick={handleSpin}
                    disabled={isSpinning || Object.keys(selectedBets).length === 0}
                    className="mt-4 btn-gold px-8 py-4 text-lg"
                  >
                    {isSpinning ? "🎡 La roue tourne..." : "🎲 Lancer la roulette"}
                  </button>
                </div>
              )}
              
              {currentGame?.status === "waiting" && (
                <div className="text-center text-gray-300">
                  En attente d'autres joueurs...
                </div>
              )}
              
              {currentGame?.status === "finished" && currentGame.result && (
                <div className="text-center animate-fade-in-up">
                  <div className="text-3xl font-bold text-white mb-2">
                    Résultat: {currentGame.result.number} {
                      currentGame.result.color === "red" ? "🔴" :
                      currentGame.result.color === "black" ? "⚫" : "🟢"
                    }
                  </div>
                  <div className="text-gray-300">Nouvelle partie dans quelques secondes...</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Betting Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chip Selection */}
          <div className="card-premium">
            <h3 className="text-xl font-bold text-white mb-4">Sélectionner vos jetons</h3>
            <div className="flex flex-wrap gap-4 justify-center">
              {CHIP_VALUES.map((value) => (
                <button
                  key={value}
                  onClick={() => setSelectedChip(value)}
                  disabled={!wallet || wallet.balance < value}
                  className={`transition-all duration-300 ${
                    selectedChip === value ? 'scale-125 animate-pulse-glow' : 'hover:scale-110'
                  }`}
                >
                  <ChipStack 
                    value={value} 
                    disabled={!wallet || wallet.balance < value}
                  />
                </button>
              ))}
            </div>
            <div className="text-center mt-4">
              <span className="text-yellow-400 font-bold text-lg">
                Jeton sélectionné: {selectedChip} 🪙
              </span>
            </div>
          </div>

          {/* Betting Board */}
          <div className="card-premium">
            <h3 className="text-xl font-bold text-white mb-4">Placer vos mises</h3>
            <BettingBoard
              selectedBets={selectedBets}
              onPlaceBet={handlePlaceBet}
              disabled={currentGame?.status !== "betting" || isSpinning}
            />
          </div>

          {/* Bet Summary */}
          {Object.keys(selectedBets).length > 0 && (
            <div className="card-premium animate-slide-in">
              <h3 className="text-xl font-bold text-white mb-4">Vos mises</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(selectedBets).map(([betKey, amount]) => (
                  <div key={betKey} className="bg-white/5 rounded-lg p-3 text-center">
                    <div className="text-white font-medium">{betKey}</div>
                    <div className="text-yellow-400 font-bold">{amount} 🪙</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <div className="text-lg font-bold text-white">
                  Total misé: {Object.values(selectedBets).reduce((sum, amount) => sum + amount, 0)} 🪙
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
