import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { useState, useEffect } from "react";
import { Dashboard } from "./components/Dashboard";
import { ProfileSetup } from "./components/ProfileSetup";
import { AdminPanel } from "./components/AdminPanel";

export default function App() {
  const [showAdmin, setShowAdmin] = useState(false);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setShowAdmin(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <Authenticated>
        <AuthenticatedApp showAdmin={showAdmin} setShowAdmin={setShowAdmin} />
      </Authenticated>
      <Unauthenticated>
        <UnauthenticatedApp />
      </Unauthenticated>
      <Toaster />
    </div>
  );
}

function AuthenticatedApp({ showAdmin, setShowAdmin }: { showAdmin: boolean; setShowAdmin: (show: boolean) => void }) {
  const currentUser = useQuery(api.users.getCurrentUser);
  
  if (currentUser === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      </div>
    );
  }
  
  if (!currentUser?.profile) {
    return <ProfileSetup />;
  }
  
  if (showAdmin) {
    return <AdminPanel />;
  }
  
  return <Dashboard />;
}

function UnauthenticatedApp() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-4">
            🎰 Casino Entre Amis
          </h1>
          <p className="text-xl text-gray-300 mb-2">
            Le casino social entre amis
          </p>
          <p className="text-sm text-gray-400">
            Jetons virtuels uniquement - Aucun argent réel
          </p>
        </div>
        <SignInForm />
      </div>
    </div>
  );
}
