import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../../convex/_generated/dataModel";

interface BlackjackGameProps {
  tableId: Id<"gameTables">;
  onBack: () => void;
}

export function BlackjackGame({ tableId, onBack }: BlackjackGameProps) {
  const [betAmount, setBetAmount] = useState(10);
  const [hasJoined, setHasJoined] = useState(false);
  
  const table = useQuery(api.games.blackjack.getActiveTables)?.find(t => t._id === tableId);
  const currentGame = useQuery(api.games.blackjack.getCurrentBlackjackGame, { tableId });
  const wallet = useQuery(api.banking.getWallet);
  
  const joinBlackjackTable = useMutation(api.games.blackjack.joinBlackjackTable);
  
  const handleJoinTable = async () => {
    if (!table || hasJoined) return;
    
    try {
      await joinBlackjackTable({
        tableId,
        betAmount,
      });
      setHasJoined(true);
      toast.success(`Rejoint la table avec une mise de ${betAmount} jetons`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    }
  };
  
  if (!table) {
    return (
      <div className="text-center text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-4"></div>
        Chargement de la table...
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
        >
          <span>←</span>
          <span>Retour au lobby</span>
        </button>
        
        <h1 className="text-3xl font-bold text-white flex items-center">
          <span className="mr-2">🃏</span>
          {table.name}
        </h1>
        
        <div className="text-right">
          <div className="text-white font-bold">
            Solde: {wallet?.balance?.toLocaleString() || 0} 🪙
          </div>
          <div className="text-sm text-gray-400">
            Mise: {table.minBet} - {table.maxBet} jetons
          </div>
        </div>
      </div>
      
      {/* Game Area */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        {!currentGame || !hasJoined ? (
          <div className="text-center space-y-6">
            <h3 className="text-2xl font-bold text-white">Rejoindre la table</h3>
            
            <div className="flex items-center justify-center space-x-4">
              <label className="text-gray-300">Mise:</label>
              <select
                value={betAmount}
                onChange={(e) => setBetAmount(parseInt(e.target.value))}
                className="bg-white/10 border border-white/20 rounded px-4 py-2 text-white"
              >
                <option value={10}>10 🪙</option>
                <option value={25}>25 🪙</option>
                <option value={50}>50 🪙</option>
                <option value={100}>100 🪙</option>
                <option value={250}>250 🪙</option>
              </select>
            </div>
            
            <button
              onClick={handleJoinTable}
              disabled={!wallet || wallet.balance < betAmount}
              className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold rounded-lg hover:from-yellow-300 hover:to-orange-400 transition-all disabled:opacity-50"
            >
              🎲 Rejoindre la partie
            </button>
          </div>
        ) : (
          <div className="text-center space-y-6">
            <h3 className="text-2xl font-bold text-white">Blackjack - En développement</h3>
            
            <div className="bg-yellow-500/20 border border-yellow-400/50 rounded-lg p-6">
              <div className="text-yellow-400 text-6xl mb-4">🚧</div>
              <h4 className="text-xl font-bold text-white mb-2">Fonctionnalité en cours de développement</h4>
              <p className="text-gray-300 mb-4">
                Le jeu de Blackjack est actuellement en développement. 
                Vous pouvez placer une mise pour réserver votre place à la table.
              </p>
              <p className="text-sm text-gray-400">
                Votre mise de {betAmount} jetons a été enregistrée.
                Le jeu sera bientôt disponible!
              </p>
            </div>
            
            <div className="flex justify-center space-x-4">
              <button
                onClick={onBack}
                className="px-6 py-3 bg-gray-500 text-white font-bold rounded-lg hover:bg-gray-400 transition-all"
              >
                🔙 Retour au lobby
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
