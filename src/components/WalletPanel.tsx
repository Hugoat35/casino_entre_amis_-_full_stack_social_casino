import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { StatCard } from "./ui/StatCard";
import { ProgressBar } from "./ui/ProgressBar";
import { CountdownTimer } from "./ui/CountdownTimer";

export function WalletPanel() {
  const wallet = useQuery(api.banking.getWallet);
  const transactions = useQuery(api.banking.getTransactionHistory, { limit: 20 });
  const [vaultAmount, setVaultAmount] = useState("");
  
  const claimDailyBonus = useMutation(api.banking.claimDailyBonus);
  const depositToVault = useMutation(api.banking.depositToVault);
  const withdrawFromVault = useMutation(api.banking.withdrawFromVault);
  const claimVaultInterest = useMutation(api.banking.claimVaultInterest);
  
  const handleClaimBonus = async () => {
    try {
      const amount = await claimDailyBonus();
      toast.success(`Bonus quotidien réclamé: ${amount} jetons!`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    }
  };
  
  const handleVaultDeposit = async () => {
    const amount = parseInt(vaultAmount);
    if (!amount || amount <= 0) return;
    
    try {
      await depositToVault({ amount });
      setVaultAmount("");
      toast.success(`${amount} jetons déposés dans le coffre`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    }
  };
  
  const handleVaultWithdraw = async () => {
    const amount = parseInt(vaultAmount);
    if (!amount || amount <= 0) return;
    
    try {
      await withdrawFromVault({ amount });
      setVaultAmount("");
      toast.success(`${amount} jetons retirés du coffre`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    }
  };
  
  const handleClaimInterest = async () => {
    try {
      const interest = await claimVaultInterest();
      if (interest > 0) {
        toast.success(`Intérêts réclamés: ${interest} jetons!`);
      } else {
        toast.info("Aucun intérêt disponible pour le moment");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    }
  };
  
  if (!wallet) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  const totalWealth = wallet.balance + wallet.vault;
  const vaultPercentage = totalWealth > 0 ? (wallet.vault / totalWealth) * 100 : 0;
  
  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Wallet Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon="💰"
          label="Solde disponible"
          value={wallet.balance}
          color="green"
        />
        <StatCard
          icon="🏦"
          label="Coffre-fort"
          value={wallet.vault}
          color="blue"
        />
        <StatCard
          icon="💎"
          label="Patrimoine total"
          value={totalWealth}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Banking Actions */}
        <div className="card-premium">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center glow-text">
            <span className="mr-3 animate-float">🏦</span>
            Gestion bancaire
          </h2>
          
          <div className="space-y-6">
            {/* Vault Progress */}
            <div className="glass rounded-xl p-4">
              <h3 className="text-lg font-bold text-white mb-3">Répartition du patrimoine</h3>
              <ProgressBar
                value={wallet.vault}
                max={totalWealth}
                label={`Coffre-fort (${vaultPercentage.toFixed(1)}%)`}
                color="blue"
                animated={true}
              />
              <div className="mt-2 text-sm text-gray-400">
                Taux d'intérêt: {(wallet.vaultInterestRate * 100).toFixed(1)}% par jour
              </div>
            </div>

            {/* Vault Management */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Montant à transférer
                </label>
                <input
                  type="number"
                  value={vaultAmount}
                  onChange={(e) => setVaultAmount(e.target.value)}
                  className="w-full px-4 py-3 glass rounded-xl text-white placeholder-gray-400 focus-ring"
                  placeholder="Montant en jetons..."
                  min="1"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleVaultDeposit}
                  disabled={!vaultAmount || parseInt(vaultAmount) <= 0 || parseInt(vaultAmount) > wallet.balance}
                  className="btn-premium bg-green-500 hover:bg-green-400"
                >
                  📥 Déposer
                </button>
                <button
                  onClick={handleVaultWithdraw}
                  disabled={!vaultAmount || parseInt(vaultAmount) <= 0 || parseInt(vaultAmount) > wallet.vault}
                  className="btn-premium bg-red-500 hover:bg-red-400"
                >
                  📤 Retirer
                </button>
              </div>
            </div>

            {/* Daily Actions */}
            <div className="space-y-3">
              <button
                onClick={handleClaimBonus}
                className="w-full btn-gold py-4 text-lg"
              >
                🎁 Réclamer bonus quotidien
              </button>
              
              <button
                onClick={handleClaimInterest}
                className="w-full btn-premium py-4 text-lg"
              >
                💎 Réclamer intérêts du coffre
              </button>
            </div>
          </div>
        </div>

        {/* Tips & Info */}
        <div className="card-premium">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center glow-text">
            <span className="mr-3 animate-float">💡</span>
            Conseils financiers
          </h2>
          
          <div className="space-y-4">
            <div className="glass rounded-xl p-4 border-l-4 border-green-400">
              <h3 className="text-lg font-bold text-green-400 mb-2">💰 Stratégie de gains</h3>
              <p className="text-gray-300 text-sm">
                Déposez régulièrement vos gains dans le coffre-fort pour bénéficier des intérêts quotidiens 
                et protéger votre capital des pertes de jeu.
              </p>
            </div>
            
            <div className="glass rounded-xl p-4 border-l-4 border-blue-400">
              <h3 className="text-lg font-bold text-blue-400 mb-2">🏦 Coffre-fort</h3>
              <p className="text-gray-300 text-sm">
                Votre coffre-fort génère {(wallet.vaultInterestRate * 100).toFixed(1)}% d'intérêts par jour. 
                Plus vous y déposez, plus vos gains passifs augmentent !
              </p>
            </div>
            
            <div className="glass rounded-xl p-4 border-l-4 border-yellow-400">
              <h3 className="text-lg font-bold text-yellow-400 mb-2">🎁 Bonus quotidien</h3>
              <p className="text-gray-300 text-sm">
                N'oubliez pas de réclamer votre bonus quotidien ! Le montant augmente avec votre niveau.
              </p>
            </div>
            
            <div className="glass rounded-xl p-4 border-l-4 border-purple-400">
              <h3 className="text-lg font-bold text-purple-400 mb-2">📊 Gestion des risques</h3>
              <p className="text-gray-300 text-sm">
                Ne misez jamais plus que ce que vous pouvez vous permettre de perdre. 
                Gardez toujours une réserve dans votre coffre-fort.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Transaction History */}
      <div className="card-premium">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center glow-text">
          <span className="mr-3 animate-float">📊</span>
          Historique des transactions
        </h2>
        
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {transactions?.map((transaction) => (
            <div
              key={transaction._id}
              className="flex justify-between items-center p-4 glass rounded-xl hover:bg-white/10 transition-all duration-300"
            >
              <div className="flex items-center space-x-4">
                <span className="text-3xl">
                  {transaction.type === "win" ? "🎉" :
                   transaction.type === "bet" ? "🎲" :
                   transaction.type === "bonus" ? "🎁" :
                   transaction.type === "interest" ? "💎" :
                   transaction.type === "deposit" ? "📥" :
                   transaction.type === "withdrawal" ? "📤" : "💸"}
                </span>
                <div>
                  <div className="text-white font-medium">{transaction.description}</div>
                  <div className="text-sm text-gray-400">
                    {new Date(transaction._creationTime).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className={`font-bold text-lg ${
                transaction.amount > 0 ? "text-green-400" : "text-red-400"
              }`}>
                {transaction.amount > 0 ? "+" : ""}{transaction.amount.toLocaleString()} 🪙
              </div>
            </div>
          )) || (
            <div className="text-center text-gray-400 py-8">
              <div className="text-4xl mb-4">📊</div>
              <p>Aucune transaction pour le moment</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
