'use client';

import { useEffect, useState } from 'react';
import { getAllTeams, addMatch, getMatches } from '@/lib/tournament';

interface Team {
  id: number;
  name: string;
  poule_id: number;
}

interface Match {
  id: number;
  home_team_id: number;
  away_team_id: number;
  stage: string;
}

interface MatchManagerProps {
  stage: string;
  title: string;
  userId: string;
}

export default function MatchManager({ stage, title, userId }: MatchManagerProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [homeTeamId, setHomeTeamId] = useState('');
  const [awayTeamId, setAwayTeamId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [stage]);

  const loadData = async () => {
    const { data: teamsData } = await getAllTeams();
    if (teamsData) setTeams(teamsData);

    const { data: matchesData } = await getMatches(stage);
    if (matchesData) setMatches(matchesData);
  };

  const handleAddMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeTeamId || !awayTeamId || homeTeamId === awayTeamId) return;

    setLoading(true);
    try {
      const { data, error } = await addMatch(
        parseInt(homeTeamId),
        parseInt(awayTeamId),
        stage
      );
      if (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de l\'ajout du match');
        return;
      }
      if (data) {
        loadData();
        setHomeTeamId('');
        setAwayTeamId('');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">{title}</h2>

      {/* Add Match Form */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Créer un match</h3>
        <form onSubmit={handleAddMatch} className="flex gap-2 flex-wrap">
          <select
            value={homeTeamId}
            onChange={(e) => setHomeTeamId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">Équipe 1</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>

          <span className="px-3 py-2 text-gray-600 font-semibold">vs</span>

          <select
            value={awayTeamId}
            onChange={(e) => setAwayTeamId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">Équipe 2</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={loading || !homeTeamId || !awayTeamId}
            className="bg-green-600 text-white px-6 py-2 rounded font-semibold hover:bg-green-700 transition disabled:opacity-50"
          >
            {loading ? 'Ajout...' : 'Ajouter Match'}
          </button>
        </form>
      </div>

      {/* Matches List */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Matchs ({matches.length})
        </h3>
        {matches.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Aucun match créé</p>
        ) : (
          <div className="space-y-2">
            {matches.map((match: any, index) => (
              <div key={match.id} className="flex justify-between items-center bg-gray-50 p-3 rounded border border-gray-200">
                <span className="text-sm text-gray-600">Match {index + 1}</span>
                <span className="font-semibold">
                  {match.home_team?.name || 'Équipe'} vs {match.away_team?.name || 'Équipe'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
