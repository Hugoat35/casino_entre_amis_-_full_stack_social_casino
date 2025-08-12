import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";
import { ParticleEffect } from "./ui/ParticleEffect";

interface FriendBettingProps {
  targetUserId: Id<"users">;
  targetUsername: string;
  gameId?: Id<"games">;
  onClose: () => void;
}

export function FriendBetting({ targetUserId, targetUsername, gameId, onClose }: FriendBettingProps) {
  const [betType, setBetType] = useState<"gains" | "losses">("gains");
  const [stake, setStake] = useState(50);
  const [showParticles, setShowParticles] = useState(false);
  const [particleOrigin, setParticleOrigin] = useState({ x: 0, y: 0 });

  const settings = useQuery(api.friendBets.getFriendBetSettings);
  const currentUser = useQuery(api.users.getCurrentUser);
  const placeBet = useMutation(api.friendBets.placeFriendBet);

  // Get current game if not provided
  const activeTables = useQuery(api.games.roulette.getActiveTables) || [];
  const currentGame = gameId ? useQuery(api.games.roulette.getCurrentGame, { tableId: activeTables[0]?._id }) : null;

  useEffect(() => {
    if (settings) {
      setStake(Math.max(settings.minStake, Math.min(settings.maxStake, 50)));
    }
  }, [settings]);

  const handlePlaceBet = async () => {
    if (!settings || !currentUser?.wallet || !currentGame) {
      toast.error("Unable to place bet at this time");
      return;
    }

    if (stake < settings.minStake || stake > settings.maxStake) {
      toast.error(`Stake must be between ${settings.minStake} and ${settings.maxStake} tokens`);
      return;
    }

    if (stake > currentUser.wallet.balance) {
      toast.error("Insufficient balance");
      return;
    }

    try {
      // Use current game or create a mock round ID for demonstration
      const roundId = currentGame?.roundNumber?.toString() || `round_${Date.now()}`;
      const tableId = activeTables[0]?._id;
      const gameIdToUse = gameId || currentGame?._id;

      if (!tableId || !gameIdToUse) {
        toast.error("No active game found");
        return;
      }

      await placeBet({
        targetId: targetUserId,
        gameId: gameIdToUse,
        tableId,
        roundId,
        betType,
        stake,
      });

      // Trigger particles
      setParticleOrigin({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
      setShowParticles(true);
      setTimeout(() => setShowParticles(false), 100);

      toast.success(`Pari placé sur les ${betType === "gains" ? "gains" : "pertes"} de ${targetUsername}!`);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors du placement du pari");
    }
  };

  if (!settings) {
    return (
      <div className="card-premium text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-4"></div>
        <p className="text-gray-400">Chargement...</p>
      </div>
    );
  }

  if (!settings.isEnabled) {
    return (
      <div className="card-premium text-center">
        <div className="text-4xl mb-4">🚫</div>
        <h3 className="text-xl font-bold text-white mb-2">Paris d'amis désactivés</h3>
        <p className="text-gray-400 mb-4">Cette fonctionnalité est temporairement indisponible.</p>
        <button onClick={onClose} className="btn-premium bg-gray-600 hover:bg-gray-700">
          Fermer
        </button>
      </div>
    );
  }

  const multiplier = betType === "gains" ? settings.gainsMultiplier : settings.lossesMultiplier;
  const potentialWin = Math.round(stake * multiplier);

  return (
    <div className="card-premium relative">
      <ParticleEffect 
        trigger={showParticles} 
        origin={particleOrigin}
        count={20}
      />

      {/* Header */}
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold gradient-text mb-2 animate-float">
          🎯 Parier sur un Ami
        </h3>
        <p className="text-lg text-white">
          Pariez sur <span className="text-yellow-400 font-bold">{targetUsername}</span>
        </p>
      </div>

      {/* Bet Type Selection */}
      <div className="mb-6">
        <label className="block text-white font-bold mb-3">Type de pari:</label>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setBetType("gains")}
            className={`p-4 rounded-xl font-bold transition-all duration-300 ${
              betType === "gains"
                ? 'bg-green-500 text-white scale-105 shadow-lg shadow-green-500/25'
                : 'bg-white/10 text-white hover:bg-white/20 hover:scale-105'
            }`}
          >
            <div className="text-2xl mb-2">📈</div>
            <div className="text-sm">Gains</div>
            <div className="text-xs text-gray-300 mt-1">
              {settings.gainsMultiplier}x
            </div>
          </button>
          
          <button
            onClick={() => setBetType("losses")}
            className={`p-4 rounded-xl font-bold transition-all duration-300 ${
              betType === "losses"
                ? 'bg-red-500 text-white scale-105 shadow-lg shadow-red-500/25'
                : 'bg-white/10 text-white hover:bg-white/20 hover:scale-105'
            }`}
          >
            <div className="text-2xl mb-2">📉</div>
            <div className="text-sm">Pertes</div>
            <div className="text-xs text-gray-300 mt-1">
              {settings.lossesMultiplier}x
            </div>
          </button>
        </div>
      </div>

      {/* Stake Input */}
      <div className="mb-6">
        <label className="block text-white font-bold mb-3">Mise:</label>
        <div className="space-y-3">
          <input
            type="range"
            min={settings.minStake}
            max={Math.min(settings.maxStake, currentUser?.wallet?.balance || 0)}
            value={stake}
            onChange={(e) => setStake(Number(e.target.value))}
            className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
          />
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">
              Min: {settings.minStake} 🪙
            </span>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {stake} 🪙
              </div>
            </div>
            <span className="text-gray-400 text-sm">
              Max: {Math.min(settings.maxStake, currentUser?.wallet?.balance || 0)} 🪙
            </span>
          </div>
        </div>
      </div>

      {/* Quick Stake Buttons */}
      <div className="mb-6">
        <div className="flex space-x-2">
          {[25, 50, 100, 250].map((amount) => (
            <button
              key={amount}
              onClick={() => setStake(Math.min(amount, Math.min(settings.maxStake, currentUser?.wallet?.balance || 0)))}
              disabled={amount > (currentUser?.wallet?.balance || 0) || amount > settings.maxStake}
              className="flex-1 btn-premium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed py-2 text-sm"
            >
              {amount}
            </button>
          ))}
        </div>
      </div>

      {/* Bet Summary */}
      <div className="glass rounded-lg p-4 mb-6">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Mise:</span>
            <span className="text-yellow-400 font-bold">{stake} 🪙</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Multiplicateur:</span>
            <span className="text-white font-bold">{multiplier}x</span>
          </div>
          <div className="flex justify-between items-center border-t border-white/20 pt-2">
            <span className="text-gray-400">Gain potentiel:</span>
            <span className="text-green-400 font-bold text-lg">{potentialWin} 🪙</span>
          </div>
        </div>
      </div>

      {/* Explanation */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-6">
        <div className="text-xs text-blue-300">
          <div className="font-bold mb-1">Comment ça marche:</div>
          {betType === "gains" ? (
            <p>Vous gagnez si {targetUsername} termine le round avec un solde positif (gains).</p>
          ) : (
            <p>Vous gagnez si {targetUsername} termine le round avec un solde négatif (pertes).</p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <button
          onClick={onClose}
          className="flex-1 btn-premium bg-gray-600 hover:bg-gray-700 py-3"
        >
          ❌ Annuler
        </button>
        
        <button
          onClick={handlePlaceBet}
          disabled={stake > (currentUser?.wallet?.balance || 0)}
          className="flex-1 btn-gold py-3 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          🎯 Placer le pari
        </button>
      </div>

      {/* Balance Warning */}
      {stake > (currentUser?.wallet?.balance || 0) && (
        <div className="mt-4 text-center text-red-400 text-sm">
          ⚠️ Solde insuffisant
        </div>
      )}
    </div>
  );
}
