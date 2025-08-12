import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { SignOutButton } from "../SignOutButton";
import { WalletPanel } from "./WalletPanel";
import { GameLobby } from "./GameLobby";
import { SocialPanel } from "./SocialPanel";
import { ProfilePanel } from "./ProfilePanel";
import { AnimatedAvatar } from "./ui/AnimatedAvatar";
import { SoundToggle } from "./ui/SoundToggle";
import { FriendBetNotification } from "./ui/FriendBetNotification";

type Tab = "games" | "wallet" | "social" | "profile";

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("games");
  const currentUser = useQuery(api.users.getCurrentUser);
  const setOnlineStatus = useMutation(api.users.setOnlineStatus);
  
  // Set user as online when component mounts
  useEffect(() => {
    setOnlineStatus({ isOnline: true });
  }, [setOnlineStatus]);
  
  if (!currentUser?.profile) return null;
  
  const tabs = [
    { id: "games" as Tab, label: "🎰 Jeux", icon: "🎲" },
    { id: "wallet" as Tab, label: "💰 Banque", icon: "💳" },
    { id: "social" as Tab, label: "👥 Social", icon: "💬" },
    { id: "profile" as Tab, label: "👤 Profil", icon: "⚙️" },
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="glass-dark border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-bold gradient-text animate-float">
                🎰 Casino Entre Amis
              </h1>
              <div className="flex items-center space-x-3 glass rounded-full px-4 py-2">
                <AnimatedAvatar 
                  emoji={currentUser.profile.avatar || "🎭"} 
                  size="sm"
                  isOnline={currentUser.profile.isOnline}
                />
                <span className="text-white font-medium">{currentUser.profile.username}</span>
                <span className="text-yellow-400 font-bold bg-yellow-400/20 px-2 py-1 rounded-full text-xs">
                  Niv. {currentUser.profile.level}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 glass rounded-full px-4 py-2 animate-pulse-glow">
                <span className="text-green-400 text-xl">💰</span>
                <span className="text-white font-bold text-lg">
                  {currentUser.wallet?.balance?.toLocaleString() || 0}
                </span>
                <span className="text-yellow-400 font-medium">jetons</span>
              </div>
              <SoundToggle />
              <SignOutButton />
            </div>
          </div>
        </div>
      </header>
      
      {/* Navigation */}
      <nav className="glass-dark border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 font-medium transition-all duration-300 relative overflow-hidden ${
                  activeTab === tab.id
                    ? "text-yellow-400 bg-white/10"
                    : "text-gray-300 hover:text-white hover:bg-white/5"
                }`}
              >
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 to-orange-500 animate-shimmer"></div>
                )}
                <span className="mr-2 text-xl">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>
      
      {/* Friend Bet Notifications */}
      <FriendBetNotification />
      
      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-fade-in-up">
          {activeTab === "games" && <GameLobby />}
          {activeTab === "wallet" && <WalletPanel />}
          {activeTab === "social" && <SocialPanel />}
          {activeTab === "profile" && <ProfilePanel />}
        </div>
      </main>
    </div>
  );
}
