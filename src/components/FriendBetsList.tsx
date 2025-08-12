import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { ParticleEffect } from "./ui/ParticleEffect";

export function FriendBetsList() {
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [showParticles, setShowParticles] = useState(false);
  const [particleOrigin, setParticleOrigin] = useState({ x: 0, y: 0 });

  const activeBets = useQuery(api.friendBets.getActiveFriendBets) || [];
  const betHistory = useQuery(api.friendBets.getFriendBetHistory, { limit: 20 }) || [];
  const cancelBet = useMutation(api.friendBets.cancelFriendBet);

  const handleCancelBet = async (betId: string) => {
    try {
      await cancelBet({ betId: betId as any });
      
      setParticleOrigin({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
      setShowParticles(true);
      setTimeout(() => setShowParticles(false), 100);
      
      toast.success("Pari annulé et mise remboursée!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    }
  };

  const getBetStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-blue-500";
      case "won": return "bg-green-500";
      case "lost": return "bg-red-500";
      case "cancelled": return "bg-gray-500";
      default: return "bg-gray-500";
    }
  };

  const getBetStatusIcon = (status: string) => {
    switch (status) {
      case "active": return "⏳";
      case "won": return "🎉";
      case "lost": return "💔";
      case "cancelled": return "❌";
      default: return "❓";
    }
  };

  const getBetTypeIcon = (betType: string) => {
    return betType === "gains" ? "📈" : "📉";
  };

  const getBetTypeColor = (betType: string) => {
    return betType === "gains" ? "text-green-400" : "text-red-400";
  };

  return (
    <div className="space-y-6">
      <ParticleEffect 
        trigger={showParticles} 
        origin={particleOrigin}
        count={15}
      />

      {/* Header */}
      <div className="card-premium text-center">
        <h2 className="text-3xl font-bold gradient-text mb-4 animate-float">
          🎯 Mes Paris d'Amis
        </h2>
        <p className="text-lg text-gray-300">
          Suivez vos paris sur les performances de vos amis
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 justify-center">
        <button
          onClick={() => setActiveTab("active")}
          className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
            activeTab === "active"
              ? 'bg-blue-500 text-white scale-105 shadow-lg shadow-blue-500/25'
              : 'bg-white/10 text-white hover:bg-white/20 hover:scale-105'
          }`}
        >
          ⏳ Paris Actifs ({activeBets.length})
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
            activeTab === "history"
              ? 'bg-purple-500 text-white scale-105 shadow-lg shadow-purple-500/25'
              : 'bg-white/10 text-white hover:bg-white/20 hover:scale-105'
          }`}
        >
          📊 Historique
        </button>
      </div>

      {/* Active Bets */}
      {activeTab === "active" && (
        <div className="card-premium">
          <h3 className="text-2xl font-bold text-white mb-6 glow-text">
            ⏳ Paris en cours ({activeBets.length})
          </h3>

          {activeBets.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4 animate-bounce">🎯</div>
              <p className="text-xl text-gray-400 mb-2">Aucun pari actif</p>
              <p className="text-sm text-gray-500">
                Allez dans l'onglet Amis pour parier sur vos amis!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeBets.map((bet) => (
                <div key={bet._id} className="glass rounded-xl p-6 hover:scale-105 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-3xl animate-float">
                        {bet.targetAvatar || "👤"}
                      </div>
                      <div>
                        <div className="text-white font-bold text-lg">
                          {bet.targetUsername}
                        </div>
                        <div className="text-sm text-gray-400">
                          {bet.gameName} • {bet.gameType}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl ${getBetTypeColor(bet.betType)}`}>
                        {getBetTypeIcon(bet.betType)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {bet.betType === "gains" ? "Gains" : "Pertes"}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Mise:</span>
                      <span className="text-yellow-400 font-bold">{bet.stake} 🪙</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Multiplicateur:</span>
                      <span className="text-white font-bold">{bet.multiplier}x</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-white/20 pt-3">
                      <span className="text-gray-400">Gain potentiel:</span>
                      <span className="text-green-400 font-bold">
                        {Math.round(bet.stake * bet.multiplier)} 🪙
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/20">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs text-gray-500">
                        Placé {new Date(bet._creationTime).toLocaleString()}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${getBetStatusColor(bet.status)} text-white`}>
                        {getBetStatusIcon(bet.status)} En attente
                      </span>
                    </div>
                    
                    <button
                      onClick={() => handleCancelBet(bet._id)}
                      className="w-full btn-premium bg-red-600 hover:bg-red-700 py-2 text-sm"
                    >
                      ❌ Annuler le pari
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bet History */}
      {activeTab === "history" && (
        <div className="card-premium">
          <h3 className="text-2xl font-bold text-white mb-6 glow-text">
            📊 Historique des paris
          </h3>

          {betHistory.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📜</div>
              <p className="text-xl text-gray-400 mb-2">Aucun historique</p>
              <p className="text-sm text-gray-500">
                Vos paris passés apparaîtront ici
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {betHistory.map((bet) => (
                <div key={bet._id} className="glass rounded-lg p-4 hover:bg-white/5 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">
                        {bet.targetAvatar || "👤"}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-bold">
                            {bet.targetUsername}
                          </span>
                          <span className={`text-lg ${getBetTypeColor(bet.betType)}`}>
                            {getBetTypeIcon(bet.betType)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-400">
                          {bet.gameName} • {new Date(bet._creationTime).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`px-3 py-1 rounded-full text-sm font-bold ${getBetStatusColor(bet.status)} text-white mb-2`}>
                        {getBetStatusIcon(bet.status)} {
                          bet.status === "won" ? "Gagné" :
                          bet.status === "lost" ? "Perdu" :
                          bet.status === "cancelled" ? "Annulé" : "Actif"
                        }
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-400">Mise: </span>
                        <span className="text-yellow-400 font-bold">{bet.stake} 🪙</span>
                      </div>
                      {bet.payout && bet.payout > 0 && (
                        <div className="text-sm">
                          <span className="text-gray-400">Gain: </span>
                          <span className="text-green-400 font-bold">{bet.payout} 🪙</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {bet.resolvedAt && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <div className="text-xs text-gray-500">
                        Résolu le {new Date(bet.resolvedAt).toLocaleString()}
                      </div>
                      {bet.targetStartBalance !== undefined && bet.targetEndBalance !== undefined && (
                        <div className="text-xs text-gray-400 mt-1">
                          Solde ami: {bet.targetStartBalance} → {bet.targetEndBalance} 
                          <span className={bet.targetEndBalance > bet.targetStartBalance ? "text-green-400" : "text-red-400"}>
                            ({bet.targetEndBalance > bet.targetStartBalance ? "+" : ""}{bet.targetEndBalance - bet.targetStartBalance})
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-premium text-center">
          <div className="text-3xl mb-2">📊</div>
          <div className="text-2xl font-bold text-white">
            {betHistory.length}
          </div>
          <div className="text-sm text-gray-400">Paris totaux</div>
        </div>

        <div className="card-premium text-center">
          <div className="text-3xl mb-2">🎉</div>
          <div className="text-2xl font-bold text-green-400">
            {betHistory.filter(bet => bet.status === "won").length}
          </div>
          <div className="text-sm text-gray-400">Paris gagnés</div>
        </div>

        <div className="card-premium text-center">
          <div className="text-3xl mb-2">💰</div>
          <div className="text-2xl font-bold text-yellow-400">
            {betHistory.reduce((sum, bet) => sum + (bet.payout || 0), 0)}
          </div>
          <div className="text-sm text-gray-400">Gains totaux</div>
        </div>
      </div>
    </div>
  );
}
