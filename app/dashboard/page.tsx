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
  const [poules, setPoules] = useState(POULES);
  const [newPouleName, setNewPouleName] = useState('');
  const [qualifiedCount, setQualifiedCount] = useState(4);
  const [savedQualifiedCount, setSavedQualifiedCount] = useState(4);
  const [qualificationDirty, setQualificationDirty] = useState(false);
  const qualifiedTeamCount = poules.length * qualifiedCount;
  const startingPhase = qualifiedTeamCount >= 32 ? '16eme' : qualifiedTeamCount >= 16 ? '8eme' : 'quart';

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

  useEffect(() => {
    const savedPoules = window.localStorage.getItem('tournament-poules');
    if (!savedPoules) return;

    try {
      const customPoules = JSON.parse(savedPoules);
      if (Array.isArray(customPoules)) setPoules(customPoules);
    } catch {
      window.localStorage.removeItem('tournament-poules');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadQualificationSetting = async () => {
      const { data } = await supabase.from('tournament_settings').select('qualified_count').eq('id', 1).maybeSingle();
      const localValue = Number(window.localStorage.getItem('tournament-qualified-count') || 4);
      const count = Number(data?.qualified_count ?? localValue);
      if (!cancelled && [2, 3, 4].includes(count)) {
        setQualifiedCount(count);
        setSavedQualifiedCount(count);
      }
    };
    loadQualificationSetting();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="w-full max-w-5xl space-y-5 px-6" aria-busy="true"><div className="h-10 w-72 animate-pulse rounded bg-gray-200" /><div className="h-12 animate-pulse rounded-lg bg-white" /><div className="grid gap-4 md:grid-cols-2"><div className="h-40 animate-pulse rounded-lg bg-white" /><div className="h-40 animate-pulse rounded-lg bg-white" /></div><div className="h-72 animate-pulse rounded-lg bg-white" /></div>
      </div>
    );
  }

  if (!user) return null;

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  const handleAddPoule = (event: React.FormEvent) => {
    event.preventDefault();
    const name = newPouleName.trim();
    if (!name) return;

    const nextId = poules.reduce((highestId, poule) => Math.max(highestId, poule.id), 0) + 1;
    const updatedPoules = [...poules, { id: nextId, name }];
    setPoules(updatedPoules);
    window.localStorage.setItem('tournament-poules', JSON.stringify(updatedPoules));
    setNewPouleName('');
  };

  const handleQualifiedCountChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const count = Number(event.target.value);
    setQualifiedCount(count);
    setQualificationDirty(count !== savedQualifiedCount);
  };

  const handleSaveQualifiedCount = async () => {
    const { error } = await supabase.from('tournament_settings').upsert({ id: 1, qualified_count: qualifiedCount });
    if (error) {
      alert('Impossible d enregistrer le nombre de qualifies. Verifiez la configuration Supabase.');
      return;
    }
    window.localStorage.setItem('tournament-qualified-count', String(qualifiedCount));
    setSavedQualifiedCount(qualifiedCount);
    setQualificationDirty(false);
  };

  const handleDeletePoule = (pouleId: number) => {
    const updatedPoules = poules.filter((poule) => poule.id !== pouleId);
    setPoules(updatedPoules);
    window.localStorage.setItem('tournament-poules', JSON.stringify(updatedPoules));
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
              onClick={() => setActiveTab('poules-matchs')}
              className={`py-4 px-2 font-semibold border-b-2 transition ${
                activeTab === 'poules-matchs'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              Matchs de Poules
            </button>
            <button
              onClick={() => setActiveTab(startingPhase)}
              className={`py-4 px-2 font-semibold border-b-2 transition ${
                activeTab === startingPhase
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              {startingPhase === '16eme' ? '16eme de Finale' : startingPhase === '8eme' ? '8eme de Finale' : 'Quart de Finale'}
            </button>
            {startingPhase === '16eme' && (
              <button
                onClick={() => setActiveTab('8eme')}
                className="py-4 px-2 font-semibold border-b-2 transition"
              >
                8eme de Finale
              </button>
            )}
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
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Phase de Poules</h2>
                <p className="mt-1 text-sm text-gray-600">{poules.length} poule(s) configurée(s)</p>
              </div>
              <form onSubmit={handleAddPoule} className="flex gap-2">
                <input
                  type="text"
                  value={newPouleName}
                  onChange={(event) => setNewPouleName(event.target.value)}
                  placeholder="Nom de la nouvelle poule"
                  className="w-56 rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <button
                  type="submit"
                  disabled={!newPouleName.trim()}
                  className="rounded bg-green-600 px-4 py-2 font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
                >
                  + Ajouter une poule
                </button>
              </form>
            </div>
            <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
              <label htmlFor="qualified-count" className="font-semibold text-gray-800">
                Équipes qualifiées par poule
              </label>
              <select
                id="qualified-count"
                value={qualifiedCount}
                onChange={handleQualifiedCountChange}
                className="rounded border border-blue-200 bg-white px-3 py-2 font-semibold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value={2}>2 équipes</option>
                <option value={3}>3 équipes</option>
                <option value={4}>4 équipes</option>
              </select>
              <span className="text-sm text-gray-600">
                {poules.length * qualifiedCount} qualifie(s) au total pour la phase suivante
              </span>
              <button type="button" onClick={handleSaveQualifiedCount} disabled={!qualificationDirty} className="rounded bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300">Enregistrer</button>
            </div>
            <div className="space-y-6">
              {poules.map((poule) => (
                <Poule
                  key={poule.id}
                  id={poule.id}
                  name={poule.name}
                  userId={user.id}
                  qualifiedCount={qualifiedCount}
                  onDelete={handleDeletePoule}
                />
              ))}
            </div>
          </div>
        )}

        {/* Elimination Tabs */}
        {(activeTab === '16eme' || activeTab === '8eme') && (
          <div className="space-y-6">
            <MatchManager stage={activeTab} title={`Matchs de ${activeTab === '16eme' ? '16eme' : '8eme'}`} userId={user.id} qualifiedCount={qualifiedCount} initialPhase={activeTab === startingPhase} />
          </div>
        )}
        {activeTab === 'poules-matchs' && (
          <div className="space-y-6">
            <MatchManager stage="poules" title="Créer les matchs de poules" userId={user.id} />
          </div>
        )}
        {activeTab === 'quart' && (
          <div className="space-y-6">
            <MatchManager stage="quart" title="Matchs de Quart" userId={user.id} qualifiedCount={qualifiedCount} initialPhase={startingPhase === 'quart'} />
            {/* <Bracket stage="quart" title="Matchs de Quart de Finale" /> */}
          </div>
        )}
        {activeTab === 'demi' && (
          <div className="space-y-6">
            <MatchManager stage="demi" title="Créer les matchs de Demi" userId={user.id} />
          </div>
        )}
        {activeTab === 'finale' && (
          <div className="space-y-6">
            <MatchManager stage="finale" title="Créer le match de Finale" userId={user.id} />
            {/* <Bracket stage="finale" title="Finale" /> */}
          </div>
        )}
      </main>
    </div>
  );
}
