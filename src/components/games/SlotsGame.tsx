import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../../convex/_generated/dataModel";
import { ChipStack } from "../ui/ChipStack";
import { ParticleEffect } from "../ui/ParticleEffect";

interface SlotsGameProps {
  tableId: Id<"gameTables">;
  onBack: () => void;
}

const SLOT_SYMBOLS = ["🍒", "🍋", "🍊", "🍇", "🔔", "💎"];

export function SlotsGame({ tableId, onBack }: SlotsGameProps) {
  const [bet, setBet] = useState(10);
  const [isSpinning, setIsSpinning] = useState(false);
  const [symbols, setSymbols] = useState(Array(9).fill("🍒"));
  const [showParticles, setShowParticles] = useState(false);
  const [particleOrigin, setParticleOrigin] = useState({ x: 0, y: 0 });
  
  const table = useQuery(api.games.slots.getActiveSlotMachines)?.find(t => t._id === tableId);
  const wallet = useQuery(api.banking.getWallet);
  const spinSlots = useMutation(api.games.slots.spinSlots);

  const handleSpin = async () => {
    if (!table || isSpinning) return;
    
    setIsSpinning(true);
    
    // Animate spinning
    const spinInterval = setInterval(() => {
      setSymbols(Array(9).fill(0).map(() => 
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]
      ));
    }, 100);
    
    try {
      const result = await spinSlots({
        tableId,
        bet,
      });
      
      setTimeout(() => {
        clearInterval(spinInterval);
        setSymbols(result.symbols);
        setIsSpinning(false);
        
        if (result.winnings > 0) {
          setParticleOrigin({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
          setShowParticles(true);
          setTimeout(() => setShowParticles(false), 100);
          
          toast.success(`Jackpot! Vous avez gagné ${result.winnings} jetons!`, {
            duration: 5000,
          });
        } else {
          toast.info("Pas de chance cette fois, retentez votre chance!");
        }
      }, 2000);
      
    } catch (error) {
      clearInterval(spinInterval);
      setIsSpinning(false);
      toast.error(error instanceof Error ? error.message : "Erreur");
    }
  };

  if (!table) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p>Chargement de la machine à sous...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <ParticleEffect 
        trigger={showParticles} 
        origin={particleOrigin}
        count={50}
      />
      
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors btn-premium"
          >
            <span>←</span>
            <span>Retour au lobby</span>
          </button>
          
          <h1 className="text-4xl font-bold text-white flex items-center gradient-text">
            <span className="mr-2 animate-float">🎰</span>
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

      <div className="max-w-4xl mx-auto">
        {/* Slot Machine */}
        <div className="card-premium text-center mb-8">
          <h3 className="text-2xl font-bold text-white mb-6 glow-text">Machine à Sous</h3>
          
          {/* Slot Display */}
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-8 mb-6">
            <div className="bg-black rounded-xl p-6">
              <div className="grid grid-cols-3 gap-4 mb-4">
                {symbols.map((symbol, index) => (
                  <div
                    key={index}
                    className={`bg-white rounded-lg h-20 flex items-center justify-center text-4xl transition-all duration-100 ${
                      isSpinning ? 'animate-pulse' : ''
                    }`}
                  >
                    {symbol}
                  </div>
                ))}
              </div>
              
              {/* Paylines indicator */}
              <div className="text-yellow-400 text-sm">
                5 lignes de paiement actives
              </div>
            </div>
          </div>
          
          {/* Controls */}
          <div className="space-y-6">
            {/* Bet Selection */}
            <div>
              <h4 className="text-lg font-bold text-white mb-4">Sélectionner votre mise</h4>
              <div className="flex justify-center space-x-4">
                {[10, 25, 50, 100, 250].map((value) => (
                  <button
                    key={value}
                    onClick={() => setBet(value)}
                    disabled={!wallet || wallet.balance < value || isSpinning}
                    className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
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
            
            {/* Spin Button */}
            <button
              onClick={handleSpin}
              disabled={isSpinning || !wallet || wallet.balance < bet}
              className="btn-gold px-12 py-6 text-2xl font-bold"
            >
              {isSpinning ? "🎰 Rotation..." : "🎲 SPIN!"}
            </button>
          </div>
        </div>
        
        {/* Paytable */}
        <div className="card-premium">
          <h3 className="text-xl font-bold text-white mb-4">Table des gains</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { symbol: "🍒", multiplier: "2x" },
              { symbol: "🍋", multiplier: "3x" },
              { symbol: "🍊", multiplier: "4x" },
              { symbol: "🍇", multiplier: "5x" },
              { symbol: "🔔", multiplier: "10x" },
              { symbol: "💎", multiplier: "20x" },
            ].map((item) => (
              <div key={item.symbol} className="glass rounded-lg p-4 text-center">
                <div className="text-3xl mb-2">{item.symbol} {item.symbol} {item.symbol}</div>
                <div className="text-yellow-400 font-bold">{item.multiplier}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
