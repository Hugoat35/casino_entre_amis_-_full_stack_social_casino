import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

const AVATAR_OPTIONS = [
  "🎭", "🎪", "🎨", "🎯", "🎲", "🃏", "🎰", "💎", "👑", "🦄",
  "🐉", "🦋", "🌟", "⚡", "🔥", "❄️", "🌈", "🎵", "🎸", "🎺"
];

export function ProfileSetup() {
  const [username, setUsername] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
  const [isLoading, setIsLoading] = useState(false);
  
  const createProfile = useMutation(api.users.createProfile);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    
    setIsLoading(true);
    try {
      await createProfile({
        username: username.trim(),
        avatar: selectedAvatar,
      });
      toast.success("Profil créé avec succès!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la création du profil");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            Créer votre profil
          </h2>
          <p className="text-gray-300">
            Choisissez votre pseudo et avatar
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Pseudo unique
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="Votre pseudo..."
              maxLength={20}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Choisir un avatar
            </label>
            <div className="grid grid-cols-5 gap-3">
              {AVATAR_OPTIONS.map((avatar) => (
                <button
                  key={avatar}
                  type="button"
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`p-3 text-2xl rounded-lg border-2 transition-all hover:scale-110 ${
                    selectedAvatar === avatar
                      ? "border-yellow-400 bg-yellow-400/20"
                      : "border-white/20 bg-white/5 hover:border-white/40"
                  }`}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>
          
          <button
            type="submit"
            disabled={!username.trim() || isLoading}
            className="w-full py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold rounded-lg hover:from-yellow-300 hover:to-orange-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Création..." : "Commencer à jouer"}
          </button>
        </form>
      </div>
    </div>
  );
}
