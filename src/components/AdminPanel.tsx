import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function AdminPanel() {
  const currentUser = useQuery(api.users.getCurrentUser);
  const [activeTab, setActiveTab] = useState<"users" | "games" | "tournaments" | "friendbets">("users");
  
  // Security check - only show admin panel to actual admins
  if (!currentUser?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card-premium text-center max-w-md">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-white mb-4">Accès Refusé</h2>
          <p className="text-gray-400 mb-6">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-premium bg-gray-600 hover:bg-gray-700"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }
  
  const users = useQuery(api.admin.getAllUsers) || [];
  const games = useQuery(api.admin.getRecentGames) || [];
  const friendBetSettings = useQuery(api.friendBets.getFriendBetSettings);
  
  const updateUserBalance = useMutation(api.admin.updateUserBalance);
  const createTournament = useMutation(api.tournaments.createTournament);
  const updateFriendBetSettings = useMutation(api.friendBets.updateFriendBetSettings);

  const [newBalance, setNewBalance] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  
  // Friend bet settings state
  const [friendBetConfig, setFriendBetConfig] = useState({
    isEnabled: true,
    minStake: 10,
    maxStake: 1000,
    gainsMultiplier: 1.8,
    lossesMultiplier: 1.5,
    cooldownMinutes: 5,
    maxActiveBetsPerUser: 3,
  });

  // Update friend bet config when settings load
  useState(() => {
    if (friendBetSettings) {
      setFriendBetConfig(friendBetSettings);
    }
  });

  const handleUpdateBalance = async () => {
    if (!selectedUserId || !newBalance) return;
    
    try {
      await updateUserBalance({
        userId: selectedUserId as any,
        newBalance: Number(newBalance),
      });
      toast.success("Solde mis à jour!");
      setNewBalance("");
      setSelectedUserId("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    }
  };

  const handleUpdateFriendBetSettings = async () => {
    try {
      await updateFriendBetSettings(friendBetConfig);
      toast.success("Paramètres des paris d'amis mis à jour!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-premium text-center">
        <h2 className="text-4xl font-bold gradient-text mb-4 animate-float">
          ⚙️ Panneau d'Administration
        </h2>
        <p className="text-xl text-gray-300">
          Gérez les utilisateurs, jeux et paramètres du casino
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 justify-center flex-wrap">
        {[
          { key: "users", label: "👥 Utilisateurs", count: users.length },
          { key: "games", label: "🎮 Jeux", count: games.length },
          { key: "tournaments", label: "🏆 Tournois", count: 0 },
          { key: "friendbets", label: "📈 Paris d'Amis", count: 0 },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
              activeTab === tab.key
                ? 'bg-yellow-500 text-black scale-105'
                : 'bg-white/10 text-white hover:bg-white/20 hover:scale-105'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "users" && (
        <div className="space-y-6">
          {/* Update User Balance */}
          <div className="card-premium">
            <h3 className="text-2xl font-bold text-white mb-6 glow-text">
              💰 Modifier le solde d'un utilisateur
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="px-4 py-3 rounded-lg bg-white/10 text-white border border-white/20"
              >
                <option value="">Sélectionner un utilisateur</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id} className="bg-gray-800">
                    {user.username} ({user.balance} jetons)
                  </option>
                ))}
              </select>
              
              <input
                type="number"
                value={newBalance}
                onChange={(e) => setNewBalance(e.target.value)}
                placeholder="Nouveau solde"
                className="px-4 py-3 rounded-lg bg-white/10 text-white border border-white/20"
              />
              
              <button
                onClick={handleUpdateBalance}
                disabled={!selectedUserId || !newBalance}
                className="btn-gold py-3"
              >
                💰 Mettre à jour
              </button>
            </div>
          </div>

          {/* Users List */}
          <div className="card-premium">
            <h3 className="text-2xl font-bold text-white mb-6 glow-text">
              👥 Liste des utilisateurs ({users.length})
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="pb-3 text-gray-300">Utilisateur</th>
                    <th className="pb-3 text-gray-300">Solde</th>
                    <th className="pb-3 text-gray-300">Niveau</th>
                    <th className="pb-3 text-gray-300">Parties</th>
                    <th className="pb-3 text-gray-300">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id} className="border-b border-white/10">
                      <td className="py-3">
                        <div className="flex items-center space-x-2">
                          <div className="text-lg">{user.avatar || "👤"}</div>
                          <div>
                            <div className="text-white font-medium">{user.username}</div>
                            <div className="text-xs text-gray-400">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-yellow-400 font-bold">
                        {user.balance?.toLocaleString() || 0} 🪙
                      </td>
                      <td className="py-3 text-white">
                        {user.level} ({user.xp} XP)
                      </td>
                      <td className="py-3 text-white">
                        {user.gamesPlayed}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          user.isOnline ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                        }`}>
                          {user.isOnline ? 'En ligne' : 'Hors ligne'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "games" && (
        <div className="card-premium">
          <h3 className="text-2xl font-bold text-white mb-6 glow-text">
            🎮 Jeux récents ({games.length})
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="pb-3 text-gray-300">Jeu</th>
                  <th className="pb-3 text-gray-300">Joueurs</th>
                  <th className="pb-3 text-gray-300">Statut</th>
                  <th className="pb-3 text-gray-300">Date</th>
                </tr>
              </thead>
              <tbody>
                {games.map((game) => (
                  <tr key={game._id} className="border-b border-white/10">
                    <td className="py-3">
                      <div className="text-white font-medium">{game.gameType}</div>
                      <div className="text-xs text-gray-400">Round {game.roundNumber}</div>
                    </td>
                    <td className="py-3 text-white">
                      {game.players.length}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        game.status === 'finished' ? 'bg-green-500' : 
                        game.status === 'playing' ? 'bg-blue-500' : 'bg-yellow-500'
                      } text-white`}>
                        {game.status}
                      </span>
                    </td>
                    <td className="py-3 text-gray-400 text-sm">
                      {new Date(game._creationTime).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "friendbets" && (
        <div className="space-y-6">
          {/* Friend Bet Settings */}
          <div className="card-premium">
            <h3 className="text-2xl font-bold text-white mb-6 glow-text">
              📈 Paramètres des Paris d'Amis
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Enable/Disable */}
              <div>
                <label className="block text-white font-bold mb-2">
                  Statut du système
                </label>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setFriendBetConfig(prev => ({ ...prev, isEnabled: true }))}
                    className={`px-4 py-2 rounded-lg font-bold transition-all ${
                      friendBetConfig.isEnabled 
                        ? 'bg-green-500 text-white' 
                        : 'bg-white/10 text-gray-400'
                    }`}
                  >
                    ✅ Activé
                  </button>
                  <button
                    onClick={() => setFriendBetConfig(prev => ({ ...prev, isEnabled: false }))}
                    className={`px-4 py-2 rounded-lg font-bold transition-all ${
                      !friendBetConfig.isEnabled 
                        ? 'bg-red-500 text-white' 
                        : 'bg-white/10 text-gray-400'
                    }`}
                  >
                    ❌ Désactivé
                  </button>
                </div>
              </div>

              {/* Min/Max Stakes */}
              <div>
                <label className="block text-white font-bold mb-2">
                  Mise minimum
                </label>
                <input
                  type="number"
                  value={friendBetConfig.minStake}
                  onChange={(e) => setFriendBetConfig(prev => ({ 
                    ...prev, 
                    minStake: Number(e.target.value) 
                  }))}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20"
                />
              </div>

              <div>
                <label className="block text-white font-bold mb-2">
                  Mise maximum
                </label>
                <input
                  type="number"
                  value={friendBetConfig.maxStake}
                  onChange={(e) => setFriendBetConfig(prev => ({ 
                    ...prev, 
                    maxStake: Number(e.target.value) 
                  }))}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20"
                />
              </div>

              {/* Multipliers */}
              <div>
                <label className="block text-white font-bold mb-2">
                  Multiplicateur Gains
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={friendBetConfig.gainsMultiplier}
                  onChange={(e) => setFriendBetConfig(prev => ({ 
                    ...prev, 
                    gainsMultiplier: Number(e.target.value) 
                  }))}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20"
                />
              </div>

              <div>
                <label className="block text-white font-bold mb-2">
                  Multiplicateur Pertes
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={friendBetConfig.lossesMultiplier}
                  onChange={(e) => setFriendBetConfig(prev => ({ 
                    ...prev, 
                    lossesMultiplier: Number(e.target.value) 
                  }))}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20"
                />
              </div>

              {/* Cooldown and Limits */}
              <div>
                <label className="block text-white font-bold mb-2">
                  Cooldown (minutes)
                </label>
                <input
                  type="number"
                  value={friendBetConfig.cooldownMinutes}
                  onChange={(e) => setFriendBetConfig(prev => ({ 
                    ...prev, 
                    cooldownMinutes: Number(e.target.value) 
                  }))}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20"
                />
              </div>

              <div>
                <label className="block text-white font-bold mb-2">
                  Paris actifs max par utilisateur
                </label>
                <input
                  type="number"
                  value={friendBetConfig.maxActiveBetsPerUser}
                  onChange={(e) => setFriendBetConfig(prev => ({ 
                    ...prev, 
                    maxActiveBetsPerUser: Number(e.target.value) 
                  }))}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20"
                />
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleUpdateFriendBetSettings}
                className="btn-gold px-8 py-3 text-lg font-bold"
              >
                💾 Sauvegarder les paramètres
              </button>
            </div>
          </div>

          {/* Current Settings Display */}
          <div className="card-premium">
            <h3 className="text-xl font-bold text-white mb-4">
              📊 Paramètres actuels
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">
                  {friendBetConfig.isEnabled ? "✅" : "❌"}
                </div>
                <div className="text-sm text-gray-400">Statut</div>
                <div className="text-white font-bold">
                  {friendBetConfig.isEnabled ? "Activé" : "Désactivé"}
                </div>
              </div>

              <div className="glass rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">💰</div>
                <div className="text-sm text-gray-400">Mises</div>
                <div className="text-white font-bold">
                  {friendBetConfig.minStake} - {friendBetConfig.maxStake}
                </div>
              </div>

              <div className="glass rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">📈</div>
                <div className="text-sm text-gray-400">Multiplicateurs</div>
                <div className="text-white font-bold">
                  {friendBetConfig.gainsMultiplier}x / {friendBetConfig.lossesMultiplier}x
                </div>
              </div>

              <div className="glass rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">⏱️</div>
                <div className="text-sm text-gray-400">Cooldown</div>
                <div className="text-white font-bold">
                  {friendBetConfig.cooldownMinutes}min
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "tournaments" && (
        <div className="card-premium">
          <h3 className="text-2xl font-bold text-white mb-6 glow-text">
            🏆 Gestion des Tournois
          </h3>
          
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🚧</div>
            <p className="text-gray-400">Gestion des tournois en développement</p>
          </div>
        </div>
      )}
    </div>
  );
}
