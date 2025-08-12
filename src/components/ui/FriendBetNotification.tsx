import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ParticleEffect } from "./ParticleEffect";

export function FriendBetNotification() {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    message: string;
    type: "win" | "loss";
    timestamp: number;
  }>>([]);
  const [showParticles, setShowParticles] = useState(false);
  const [particleOrigin, setParticleOrigin] = useState({ x: 0, y: 0 });

  const betsOnUser = useQuery(api.friendBets.getBetsOnUser) || [];

  // Monitor for new bets placed on the user
  useEffect(() => {
    if (betsOnUser.length > 0) {
      const latestBet = betsOnUser[betsOnUser.length - 1];
      const now = Date.now();
      
      // Only show notification for very recent bets (last 5 seconds)
      if (now - latestBet._creationTime < 5000) {
        const newNotification = {
          id: latestBet._id,
          message: `Un ami a parié sur vos ${latestBet.betType === "gains" ? "gains" : "pertes"}!`,
          type: latestBet.betType as "win" | "loss",
          timestamp: now,
        };
        
        setNotifications(prev => [...prev, newNotification]);
        
        // Trigger particles
        setParticleOrigin({ x: window.innerWidth - 100, y: 100 });
        setShowParticles(true);
        setTimeout(() => setShowParticles(false), 100);
        
        // Auto-remove notification after 5 seconds
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
        }, 5000);
      }
    }
  }, [betsOnUser]);

  if (notifications.length === 0) return null;

  return (
    <>
      <ParticleEffect 
        trigger={showParticles} 
        origin={particleOrigin}
        count={10}
      />
      
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`glass rounded-lg p-4 max-w-sm animate-slide-in-right ${
              notification.type === "win" ? "border-l-4 border-green-400" : "border-l-4 border-red-400"
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`text-2xl ${notification.type === "win" ? "animate-bounce" : "animate-pulse"}`}>
                {notification.type === "win" ? "📈" : "📉"}
              </div>
              <div>
                <div className="text-white font-bold text-sm">
                  Pari d'ami!
                </div>
                <div className="text-gray-300 text-xs">
                  {notification.message}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
