import { useState } from "react";
import { FriendBetting } from "../FriendBetting";
import { Id } from "../../../convex/_generated/dataModel";

interface FriendBetButtonProps {
  targetUserId: Id<"users">;
  targetUsername: string;
  gameId?: Id<"games">;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary";
}

export function FriendBetButton({ 
  targetUserId, 
  targetUsername, 
  gameId, 
  size = "md",
  variant = "primary" 
}: FriendBetButtonProps) {
  const [showModal, setShowModal] = useState(false);

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  const variantClasses = {
    primary: "btn-premium bg-gradient-to-r from-green-600 to-red-600 hover:from-green-700 hover:to-red-700",
    secondary: "btn-premium bg-blue-600 hover:bg-blue-700"
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`${variantClasses[variant]} ${sizeClasses[size]} font-bold transition-all duration-300 hover:scale-105`}
      >
        📈 Parier
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full">
            <FriendBetting
              targetUserId={targetUserId}
              targetUsername={targetUsername}
              gameId={gameId}
              onClose={() => setShowModal(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
