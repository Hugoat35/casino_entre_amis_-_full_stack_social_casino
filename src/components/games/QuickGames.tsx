import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { ParticleEffect } from "../ui/ParticleEffect";

interface QuickGamesProps {
  onBack: () => void;
}

export function QuickGames({ onBack }: QuickGamesProps) {
  const [coinBet, setCoinBet] = useState(10);
  const [coinChoice, setCoinChoice] = useState<"heads" | "tails">("heads");
  const [highLowBet, setHighLowBet] = useState(10);
  const [highLowChoice, setHighLowChoice] = useState<"high" | "low">("high");
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [showParticles, setShowParticles] = useState(false);
  const [particleOrigin, setParticleOrigin] = useState({ x: 0, y: 0 });
  
  const wallet = useQuery(api.banking.getWallet);
  const coinFlip = useMutation(api.games.quickGames.coinFlip);
  const highLow = useMutation(api.games.quickGames.highLow);
  const dailyWheel = useMutation(api.games.quickGames.dailyWheel);

  const handleCoinFlip = async () => {
    setIsPlaying("coin");
    
    try {
      const result = await coinFlip({
        bet: coinBet,
        choice: coinChoice,
      });
      
      setTimeout(() => {
        setIsPlaying(null);
        
        if (result.won) {
          setParticleOrigin({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
          setShowParticles(true);
          setTimeout(() => setShowParticles(false), 100);
          
          toast.success(`${result.result === "heads" ? "Face" : "Pile"}! Vous avez gagné ${result.payout} jetons!`);
        } else {
          toast.info(`${result.result === "heads" ? "Face" : "Pile"}! Pas de chance cette fois.`);
        }
      }, 2000);
      
    } catch (error) {
      setIsPlaying(null);
      toast.error(error instanceof Error ? error.message : "Erreur");
    }
  };

  const handleHighLow = async () => {
    setIsPlaying("highlow");
    
    try {
      const result = await highLow({
        bet: highLowBet,
        choice: highLowChoice,
      });
      
      setTimeout(() => {
        setIsPlaying(null);
        
        if (result.won) {
          setParticleOrigin({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
          setShowParticles(true);
          setTimeout(() => setShowParticles(false), 100);
          
          toast.success(`Numéro ${result.number}! Vous avez gagné ${result.payout} jetons!`);
        } else {
          toast.info(`Numéro ${result.number}! Pas de chance cette fois.`);
        }
      }, 2000);
      
    } catch (error) {
      setIsPlaying(null);
      toast.error(error instanceof Error ? error.message : "Erreur");
    }
  };

  const handleDailyWheel = async () => {
    setIsPlaying("wheel");
    
    try {
      const result = await dailyWheel();
      
      setTimeout(() => {
        setIsPlaying(null);
        setParticleOrigin({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
        setShowParticles(true);
        setTimeout(() => setShowParticles(false), 100);
        
        toast.success(`Roue quotidienne! Vous avez gagné ${result.prize} jetons!`);
      }, 3000);
      
    } catch (error) {
      setIsPlaying(null);
      toast.error(error instanceof Error ? error.message : "Erreur");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <ParticleEffect 
        trigger={showParticles} 
        origin={particleOrigin}
        count={40}
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
            <span className="mr-2 animate-float">⚡</span>
            Jeux Rapides
          </h1>
          
          <div className="text-right">
            <div className="text-white font-bold text-lg">
              💰 {wallet?.balance?.toLocaleString() || 0} jetons
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coin Flip */}
        <div className="card-premium">
          <h3 className="text-2xl font-bold text-white mb-6 text-center glow-text">
            🪙 Pile ou Face
          </h3>
          
          <div className="space-y-6">
            <div className="text-center">
              <div className={`text-8xl mb-4 ${isPlaying === "coin" ? "animate-spin" : ""}`}>
                {coinChoice === "heads" ? "👑" : "🪙"}
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-bold text-white mb-3 text-center">Votre choix</h4>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setCoinChoice("heads")}
                  disabled={isPlaying === "coin"}
                  className={`p-3 rounded-lg font-bold transition-all ${
                    coinChoice === "heads"
                      ? 'bg-yellow-500 text-black'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  } disabled:opacity-50`}
                >
                  👑 Face
                </button>
                <button
                  onClick={() => setCoinChoice("tails")}
                  disabled={isPlaying === "coin"}
                  className={`p-3 rounded-lg font-bold transition-all ${
                    coinChoice === "tails"
                      ? 'bg-yellow-500 text-black'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  } disabled:opacity-50`}
                >
                  🪙 Pile
                </button>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-bold text-white mb-3 text-center">Mise</h4>
              <div className="flex justify-center space-x-2">
                {[10, 25, 50, 100].map((value) => (
                  <button
                    key={value}
                    onClick={() => setCoinBet(value)}
                    disabled={isPlaying === "coin"}
                    className={`px-3 py-2 rounded font-bold text-sm transition-all ${
                      coinBet === value
                        ? 'bg-yellow-500 text-black'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    } disabled:opacity-50`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
            
            <button
              onClick={handleCoinFlip}
              disabled={isPlaying === "coin" || !wallet || wallet.balance < coinBet}
              className="w-full btn-gold py-3"
            >
              {isPlaying === "coin" ? "🪙 Lancement..." : `🎲 Jouer ${coinBet} jetons`}
            </button>
          </div>
        </div>

        {/* High/Low */}
        <div className="card-premium">
          <h3 className="text-2xl font-bold text-white mb-6 text-center glow-text">
            📊 Haut ou Bas
          </h3>
          
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-6xl mb-4">
                {isPlaying === "highlow" ? "🎲" : "🎯"}
              </div>
              <p className="text-gray-300 text-sm">
                Devinez si le nombre sera supérieur ou inférieur à 50
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-bold text-white mb-3 text-center">Votre choix</h4>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setHighLowChoice("high")}
                  disabled={isPlaying === "highlow"}
                  className={`p-3 rounded-lg font-bold transition-all ${
                    highLowChoice === "high"
                      ? 'bg-green-500 text-white'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  } disabled:opacity-50`}
                >
                  📈 Haut (51-100)
                </button>
                <button
                  onClick={() => setHighLowChoice("low")}
                  disabled={isPlaying === "highlow"}
                  className={`p-3 rounded-lg font-bold transition-all ${
                    highLowChoice === "low"
                      ? 'bg-red-500 text-white'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  } disabled:opacity-50`}
                >
                  📉 Bas (1-50)
                </button>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-bold text-white mb-3 text-center">Mise</h4>
              <div className="flex justify-center space-x-2">
                {[10, 25, 50, 100].map((value) => (
                  <button
                    key={value}
                    onClick={() => setHighLowBet(value)}
                    disabled={isPlaying === "highlow"}
                    className={`px-3 py-2 rounded font-bold text-sm transition-all ${
                      highLowBet === value
                        ? 'bg-yellow-500 text-black'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    } disabled:opacity-50`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
            
            <button
              onClick={handleHighLow}
              disabled={isPlaying === "highlow" || !wallet || wallet.balance < highLowBet}
              className="w-full btn-gold py-3"
            >
              {isPlaying === "highlow" ? "🎲 Tirage..." : `🎯 Jouer ${highLowBet} jetons`}
            </button>
          </div>
        </div>

        {/* Daily Wheel */}
        <div className="card-premium">
          <h3 className="text-2xl font-bold text-white mb-6 text-center glow-text">
            🎡 Roue Quotidienne
          </h3>
          
          <div className="space-y-6">
            <div className="text-center">
              <div className={`text-8xl mb-4 ${isPlaying === "wheel" ? "animate-spin" : ""}`}>
                🎡
              </div>
              <p className="text-gray-300 text-sm">
                Tournez la roue une fois par jour pour gagner des jetons gratuits!
              </p>
            </div>
            
            <div className="space-y-3">
              <h4 className="text-lg font-bold text-white text-center">Prix possibles</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  { prize: "50 🪙", chance: "30%" },
                  { prize: "100 🪙", chance: "25%" },
                  { prize: "200 🪙", chance: "20%" },
                  { prize: "500 🪙", chance: "15%" },
                  { prize: "1000 🪙", chance: "8%" },
                  { prize: "2500 🪙", chance: "2%" },
                ].map((item, index) => (
                  <div key={index} className="bg-white/5 rounded p-2 text-center">
                    <div className="text-yellow-400 font-bold">{item.prize}</div>
                    <div className="text-gray-400 text-xs">{item.chance}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <button
              onClick={handleDailyWheel}
              disabled={isPlaying === "wheel"}
              className="w-full btn-gold py-3"
            >
              {isPlaying === "wheel" ? "🎡 Rotation..." : "🎁 Roue Gratuite"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
