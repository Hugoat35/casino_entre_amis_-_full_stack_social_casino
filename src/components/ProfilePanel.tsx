import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

const AVATAR_OPTIONS = [
  "🎭", "🎪", "🎨", "🎯", "🎲", "🃏", "🎰", "💎", "👑", "🦄",
  "🐉", "🦋", "🌟", "⚡", "🔥", "❄️", "🌈", "🎵", "🎸", "🎺"
];

export function ProfilePanel() {
  const currentUser = useQuery(api.users.getCurrentUser);
  const leaderboard = useQuery(api.users.getLeaderboard) || [];
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newAvatar, setNewAvatar] = useState("");
  
  const updateProfile = useMutation(api.users.updateProfile);
  
  const handleEditProfile = () => {
    if (currentUser?.profile) {
      setNewUsername(currentUser.profile.username);
      setNewAvatar(currentUser.profile.avatar || AVATAR_OPTIONS[0]);
      setIsEditing(true);
    }
  };
  
  const handleSaveProfile = async () => {
    try {
      await updateProfile({
        username: newUsername.trim(),
        avatar: newAvatar,
      });
      setIsEditing(false);
      toast.success("Profil mis à jour!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    }
  };
  
  if (!currentUser?.profile) return null;
  
  const userRank = leaderboard.findIndex(p => p.userId === currentUser.profile?.userId) + 1;
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Profile Info */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <span className="mr-2">👤</span>
            Mon Profil
          </h2>
          <button
            onClick={handleEditProfile}
            className="px-4 py-2 bg-yellow-500 text-black font-bold rounded hover:bg-yellow-400 transition-all"
          >
            ✏️ Modifier
          </button>
        </div>
        
        {!isEditing ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <span className="text-6xl">{currentUser.profile.avatar}</span>
              <div>
                <h3 className="text-2xl font-bold text-white">{currentUser.profile.username}</h3>
                <div className="text-yellow-400 font-bold">Niveau {currentUser.profile.level}</div>
                <div className="text-gray-300">Rang #{userRank || "Non classé"}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-400">{currentUser.profile.totalWinnings.toLocaleString()}</div>
                <div className="text-sm text-gray-400">Gains totaux</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-400">{currentUser.profile.totalLosses.toLocaleString()}</div>
                <div className="text-sm text-gray-400">Pertes totales</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-400">{currentUser.profile.gamesPlayed}</div>
                <div className="text-sm text-gray-400">Parties jouées</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-purple-400">{currentUser.profile.xp}</div>
                <div className="text-sm text-gray-400">Points XP</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nouveau pseudo
              </label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                maxLength={20}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Nouvel avatar
              </label>
              <div className="grid grid-cols-5 gap-3">
                {AVATAR_OPTIONS.map((avatar) => (
                  <button
                    key={avatar}
                    type="button"
                    onClick={() => setNewAvatar(avatar)}
                    className={`p-3 text-2xl rounded-lg border-2 transition-all hover:scale-110 ${
                      newAvatar === avatar
                        ? "border-yellow-400 bg-yellow-400/20"
                        : "border-white/20 bg-white/5 hover:border-white/40"
                    }`}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleSaveProfile}
                className="flex-1 py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-400 transition-all"
              >
                💾 Sauvegarder
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 py-3 bg-gray-500 text-white font-bold rounded-lg hover:bg-gray-400 transition-all"
              >
                ❌ Annuler
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Leaderboard */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <span className="mr-2">🏆</span>
          Classement
        </h2>
        
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {leaderboard.slice(0, 20).map((player, index) => (
            <div
              key={player._id}
              className={`flex items-center space-x-3 p-3 rounded-lg ${
                player.userId === currentUser.profile?.userId
                  ? "bg-yellow-500/20 border border-yellow-400/50"
                  : "bg-white/5"
              }`}
            >
              <div className="text-lg font-bold text-yellow-400">#{index + 1}</div>
              <span className="text-xl">{player.avatar}</span>
              <div className="flex-1">
                <div className="text-white font-medium">{player.username}</div>
                <div className="text-sm text-gray-400">Niveau {player.level} • {player.xp} XP</div>
              </div>
              <div className="text-right">
                <div className="text-green-400 font-bold">+{player.totalWinnings.toLocaleString()}</div>
                <div className="text-sm text-gray-400">{player.gamesPlayed} parties</div>
              </div>
            </div>
          ))}
          
          {leaderboard.length === 0 && (
            <div className="text-center text-gray-400 py-8">
              Aucun joueur classé pour le moment
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
