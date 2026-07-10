'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { signOut } from '@/lib/auth';
import Poule from '@/components/Poule';
import Bracket from '@/components/Bracket';
import MatchManager from '@/components/MatchManager';
import { POULES } from '@/lib/tournament';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('poules');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
        setUser(session.user);
      }
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl font-semibold text-gray-700">Chargement...</div>
      </div>
    );
  }

  if (!user) return null;

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Gestionnaire de Tournoi</h1>
            <p className="text-blue-100 text-sm mt-1">{user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2 rounded-lg font-semibold transition"
          >
            Déconnexion
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab('poules')}
              className={`py-4 px-2 font-semibold border-b-2 transition ${
                activeTab === 'poules'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              📊 Poules
            </button>
            <button
              onClick={() => setActiveTab('8eme')}
              className={`py-4 px-2 font-semibold border-b-2 transition ${
                activeTab === '8eme'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              🥊 8ème de Finale
            </button>
            <button
              onClick={() => setActiveTab('quart')}
              className={`py-4 px-2 font-semibold border-b-2 transition ${
                activeTab === 'quart'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              ⚔️ Quart de Finale
            </button>
            <button
              onClick={() => setActiveTab('demi')}
              className={`py-4 px-2 font-semibold border-b-2 transition ${
                activeTab === 'demi'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              🏆 Demi-Finale
            </button>
            <button
              onClick={() => setActiveTab('finale')}
              className={`py-4 px-2 font-semibold border-b-2 transition ${
                activeTab === 'finale'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              👑 Finale
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Poules Tab */}
        {activeTab === 'poules' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Phase de Poules</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {POULES.map((poule) => (
                <Poule
                  key={poule.id}
                  id={poule.id}
                  name={poule.name}
                  maxTeams={poule.teams}
                  userId={user.id}
                />
              ))}
            </div>
          </div>
        )}

        {/* Elimination Tabs */}
        {activeTab === '8eme' && (
          <div className="space-y-6">
            <MatchManager stage="8eme" title="Créer les matchs de 8ème" userId={user.id} />
            <Bracket stage="8eme" title="Matchs de 8ème de Finale" />
          </div>
        )}
        {activeTab === 'quart' && (
          <div className="space-y-6">
            <MatchManager stage="quart" title="Créer les matchs de Quart" userId={user.id} />
            <Bracket stage="quart" title="Matchs de Quart de Finale" />
          </div>
        )}
        {activeTab === 'demi' && (
          <div className="space-y-6">
            <MatchManager stage="demi" title="Créer les matchs de Demi" userId={user.id} />
            <Bracket stage="demi" title="Matchs de Demi-Finale" />
          </div>
        )}
        {activeTab === 'finale' && (
          <div className="space-y-6">
            <MatchManager stage="finale" title="Créer le match de Finale" userId={user.id} />
            <Bracket stage="finale" title="Finale" />
          </div>
        )}
      </main>
    </div>
  );
}
