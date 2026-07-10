'use client';

import { useEffect, useState } from 'react';
import { getTeams, addTeam } from '@/lib/tournament';

interface Team {
  id: number;
  name: string;
  points: number;
  poule_id: number;
}

interface PouleProps {
  id: number;
  name: string;
  maxTeams: number;
  userId: string;
}

export default function Poule({ id, name, maxTeams, userId }: PouleProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTeams();
  }, [id]);

  const loadTeams = async () => {
    const { data } = await getTeams(id);
    if (data) setTeams(data);
  };

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim() || teams.length >= maxTeams) return;

    setLoading(true);
    try {
      const { data, error } = await addTeam(id, newTeamName, userId);
      if (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de l\'ajout de l\'équipe');
        return;
      }
      if (data) {
        setTeams([...teams, data[0]]);
        setNewTeamName('');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">{name}</h2>
      <p className="text-sm text-gray-600 mb-4">
        Équipes : {teams.length}/{maxTeams}
      </p>

      <div className="mb-6">
        <div className="space-y-2">
          {teams.map((team) => (
            <div
              key={team.id}
              className="flex justify-between items-center bg-gray-50 p-3 rounded border border-gray-200"
            >
              <span className="font-medium text-gray-700">{team.name}</span>
              <span className="bg-blue-600 text-white px-3 py-1 rounded font-semibold">
                {team.points}pts
              </span>
            </div>
          ))}
        </div>
      </div>

      {teams.length < maxTeams && (
        <form onSubmit={handleAddTeam} className="flex gap-2">
          <input
            type="text"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            placeholder="Nom de l'équipe"
            className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <button
            type="submit"
            disabled={loading || !newTeamName.trim()}
            className="bg-green-600 text-white px-4 py-2 rounded font-semibold hover:bg-green-700 transition disabled:opacity-50"
          >
            {loading ? 'Ajout...' : 'Ajouter'}
          </button>
        </form>
      )}
    </div>
  );
}
