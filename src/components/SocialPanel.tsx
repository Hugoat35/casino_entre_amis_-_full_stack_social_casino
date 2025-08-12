import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { FriendBetting } from "./FriendBetting";
import { FriendBetsList } from "./FriendBetsList";

export function SocialPanel() {
  const [activeTab, setActiveTab] = useState<"friends" | "requests" | "bets">("friends");
  const [showBettingModal, setShowBettingModal] = useState<{
    targetUserId: string;
    targetUsername: string;
    gameId?: string;
  } | null>(null);

  const friends = useQuery(api.social.getFriends) || [];
  const friendRequests = useQuery(api.social.getFriendRequests) || [];
  const onlineFriends = friends.filter(friend => friend.isOnline);
  
  const sendFriendRequest = useMutation(api.social.sendFriendRequest);
  const acceptFriendRequest = useMutation(api.social.acceptFriendRequest);
  const rejectFriendRequest = useMutation(api.social.rejectFriendRequest);

  const handleSendRequest = async (username: string) => {
    try {
      await sendFriendRequest({ username });
      toast.success(`Demande d'ami envoyée à ${username}!`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await acceptFriendRequest({ requestId: requestId as any });
      toast.success("Demande d'ami acceptée!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await rejectFriendRequest({ requestId: requestId as any });
      toast.success("Demande d'ami rejetée.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    }
  };

  const openBettingModal = (targetUserId: string, targetUsername: string, gameId?: string) => {
    setShowBettingModal({ targetUserId, targetUsername, gameId });
  };

  return (
    <div className="space-y-6">
      {/* Betting Modal */}
      {showBettingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full">
            <FriendBetting
              targetUserId={showBettingModal.targetUserId as any}
              targetUsername={showBettingModal.targetUsername}
              gameId={showBettingModal.gameId as any}
              onClose={() => setShowBettingModal(null)}
            />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="card-premium text-center">
        <h2 className="text-4xl font-bold gradient-text mb-4 animate-float">
          👥 Réseau Social
        </h2>
        <p className="text-xl text-gray-300">
          Connectez-vous avec vos amis et pariez sur leurs performances!
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 justify-center">
        {[
          { key: "friends", label: "👥 Amis", count: friends.length },
          { key: "requests", label: "📨 Demandes", count: friendRequests.length },
          { key: "bets", label: "🎯 Paris", count: 0 },
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
      {activeTab === "friends" && (
        <div className="space-y-6">
          {/* Add Friend */}
          <div className="card-premium">
            <h3 className="text-2xl font-bold text-white mb-4 glow-text">
              ➕ Ajouter un ami
            </h3>
            <div className="flex space-x-4">
              <input
                type="text"
                placeholder="Nom d'utilisateur..."
                className="flex-1 px-4 py-3 rounded-lg bg-white/10 text-white border border-white/20 focus:border-yellow-400 focus:outline-none"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSendRequest((e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
              />
              <button
                onClick={() => {
                  const input = document.querySelector('input[placeholder="Nom d\'utilisateur..."]') as HTMLInputElement;
                  if (input?.value) {
                    handleSendRequest(input.value);
                    input.value = '';
                  }
                }}
                className="btn-gold px-6 py-3"
              >
                📨 Envoyer
              </button>
            </div>
          </div>

          {/* Online Friends */}
          <div className="card-premium">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center glow-text">
              <span className="mr-3 animate-float">🟢</span>
              Amis en ligne ({onlineFriends.length})
            </h3>

            {onlineFriends.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">😴</div>
                <p className="text-gray-400">Aucun ami en ligne</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {onlineFriends.map((friend) => (
                  <div key={friend._id} className="glass rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="text-3xl">
                            {friend.avatar || "👤"}
                          </div>
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                        </div>
                        <div>
                          <div className="text-white font-bold">
                            {friend.username}
                          </div>
                          <div className="text-sm text-gray-400">
                            Niveau {friend.level} • {friend.xp} XP
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => openBettingModal(friend.userId, friend.username)}
                        className="flex-1 btn-premium bg-gradient-to-r from-green-600 to-red-600 hover:from-green-700 hover:to-red-700 py-2 text-sm"
                      >
                        📈 Parier sur ami
                      </button>
                      <button className="btn-premium bg-blue-600 hover:bg-blue-700 px-3 py-2 text-sm">
                        💬
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* All Friends */}
          <div className="card-premium">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center glow-text">
              <span className="mr-3">👥</span>
              Tous les amis ({friends.length})
            </h3>

            {friends.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">👋</div>
                <p className="text-gray-400">Aucun ami pour le moment</p>
                <p className="text-sm text-gray-500 mt-2">
                  Ajoutez des amis pour commencer à parier sur leurs performances!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {friends.map((friend) => (
                  <div key={friend._id} className="glass rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="relative">
                        <div className="text-2xl">
                          {friend.avatar || "👤"}
                        </div>
                        {friend.isOnline && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-medium">
                          {friend.username}
                        </div>
                        <div className="text-xs text-gray-400">
                          {friend.isOnline ? "En ligne" : `Vu ${new Date(friend.lastSeen).toLocaleDateString()}`}
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 mb-3">
                      Niveau {friend.level} • {friend.gamesPlayed} parties
                    </div>

                    <button
                      onClick={() => openBettingModal(friend.userId, friend.username)}
                      className="w-full btn-premium bg-gradient-to-r from-green-600 to-red-600 hover:from-green-700 hover:to-red-700 py-2 text-sm"
                    >
                      📈 Parier
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "requests" && (
        <div className="card-premium">
          <h3 className="text-2xl font-bold text-white mb-6 glow-text">
            📨 Demandes d'amitié
          </h3>

          {friendRequests.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📭</div>
              <p className="text-gray-400">Aucune demande d'amitié</p>
            </div>
          ) : (
            <div className="space-y-4">
              {friendRequests.map((request) => (
                <div key={request._id} className="glass rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">👤</div>
                      <div>
                        <div className="text-white font-bold">
                          {request.requesterUsername}
                        </div>
                        <div className="text-sm text-gray-400">
                          Demande d'amitié
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAcceptRequest(request._id)}
                        className="btn-premium bg-green-600 hover:bg-green-700 px-4 py-2 text-sm"
                      >
                        ✅ Accepter
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request._id)}
                        className="btn-premium bg-red-600 hover:bg-red-700 px-4 py-2 text-sm"
                      >
                        ❌ Refuser
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "bets" && <FriendBetsList />}
    </div>
  );
}
