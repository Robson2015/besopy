'use client';

import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { getTeams, getMatches, addTeam, deleteTeam, deleteTeamsByPoule } from '@/lib/tournament';

interface Team {
  id: number;
  name: string;
  poule_id: number;
}

interface Match {
  id: number;
  home_team_id: number;
  away_team_id: number;
  home_score: number | null;
  away_score: number | null;
  status: string;
  created_at?: string;
}

interface Standing extends Team {
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  recentResults: Array<'win' | 'draw' | 'loss'>;
}

interface PouleProps {
  id: number;
  name: string;
  userId: string;
  qualifiedCount: number;
  terrain: string;
  onSaveTerrain: (id: number, terrain: string) => Promise<void>;
  onDelete: (id: number) => void;
}

export default function Poule({ id, name, userId, qualifiedCount, terrain, onSaveTerrain, onDelete }: PouleProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [terrainValue, setTerrainValue] = useState(terrain);
  const [savingTerrain, setSavingTerrain] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTeams();
  }, [id]);

  useEffect(() => {
    setTerrainValue(terrain);
  }, [terrain]);

  const loadTeams = async () => {
    const [{ data: teamsData }, { data: matchesData }] = await Promise.all([
      getTeams(id),
      getMatches('poules'),
    ]);
    if (teamsData) setTeams(teamsData);
    if (matchesData) setMatches(matchesData);
  };

  const recentCount = Math.max(teams.length - 1, 0);
  const standings: Standing[] = teams
    .map((team) => {
      const standing: Standing = {
        ...team,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
        recentResults: [],
      };

      matches
        .filter((match) => match.status === 'completed')
        .sort((first, second) => {
          return new Date(first.created_at || 0).getTime() - new Date(second.created_at || 0).getTime();
        })
        .forEach((match) => {
        const isHome = match.home_team_id === team.id;
        const isAway = match.away_team_id === team.id;
        if (!isHome && !isAway || match.home_score === null || match.away_score === null) {
          return;
        }

        const goalsFor = isHome ? match.home_score : match.away_score;
        const goalsAgainst = isHome ? match.away_score : match.home_score;
        standing.played += 1;
        standing.goalsFor += goalsFor;
        standing.goalsAgainst += goalsAgainst;

        if (goalsFor > goalsAgainst) {
          standing.won += 1;
          standing.points += 3;
          standing.recentResults.push('win');
        } else if (goalsFor === goalsAgainst) {
          standing.drawn += 1;
          standing.points += 1;
          standing.recentResults.push('draw');
        } else {
          standing.lost += 1;
          standing.recentResults.push('loss');
        }
      });

      standing.recentResults = recentCount ? standing.recentResults.slice(-recentCount) : [];

      standing.goalDifference = standing.goalsFor - standing.goalsAgainst;
      return standing;
    })
    .sort((first, second) =>
      second.points - first.points ||
      second.goalDifference - first.goalDifference ||
      second.goalsFor - first.goalsFor ||
      first.name.localeCompare(second.name)
    );

  const handleDeleteTeam = async (team: Team) => {
    if (!window.confirm('Supprimer ' + team.name + ' et tous ses matchs ?')) return;
    setLoading(true);
    try {
      const { error } = await deleteTeam(team.id, userId);
      if (error) {
        alert('Impossible de supprimer cette equipe.');
        return;
      }
      setTeams((current) => current.filter((item) => item.id !== team.id));
      setMatches((current) => current.filter((match) => match.home_team_id !== team.id && match.away_team_id !== team.id));
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

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
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4">
        <h2 className="text-xl font-bold text-gray-900">{name}</h2>
        <button
          type="button"
          onClick={async () => {
            if (!window.confirm(`Supprimer ${name} et toutes ses équipes ?`)) return;
            const { error } = await deleteTeamsByPoule(id, userId);
            if (error) {
              alert('Erreur lors de la suppression de la poule');
              return;
            }
            onDelete(id);
          }}
          className="inline-flex items-center gap-1 rounded px-2 py-1 text-sm font-medium text-red-600 transition hover:bg-red-50"
          title="Supprimer la poule"
        >
          <Trash2 size={16} />
          Supprimer
        </button>
      </div>

      <form onSubmit={async (event) => {
        event.preventDefault();
        setSavingTerrain(true);
        try { await onSaveTerrain(id, terrainValue.trim()); }
        finally { setSavingTerrain(false); }
      }} className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-4 py-3">
        <label htmlFor={'poule-terrain-' + id} className="text-sm font-medium text-gray-700">Terrain</label>
        <input id={'poule-terrain-' + id} type="text" value={terrainValue} onChange={(event) => setTerrainValue(event.target.value)} placeholder="Nom du terrain" className="min-w-0 flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
        <button type="submit" disabled={savingTerrain || terrainValue.trim() === terrain} className="rounded bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300">{savingTerrain ? 'Enregistrement...' : 'Enregistrer le terrain'}</button>
      </form>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[830px] text-sm">
          <thead className="border-b border-gray-200 text-xs text-gray-600">
            <tr>
              <th className="w-10 px-3 py-3 text-center font-medium">#</th>
              <th className="px-3 py-3 text-left font-medium">Club</th>
              <th className="px-2 py-3 text-center font-medium" title="Matchs joués">MJ</th>
              <th className="px-2 py-3 text-center font-medium" title="Victoires">G</th>
              <th className="px-2 py-3 text-center font-medium" title="Matchs nuls">N</th>
              <th className="px-2 py-3 text-center font-medium" title="Défaites">P</th>
              <th className="px-2 py-3 text-center font-medium" title="Buts pour">BP</th>
              <th className="px-2 py-3 text-center font-medium" title="Buts contre">BC</th>
              <th className="px-2 py-3 text-center font-medium" title="Différence de buts">DB</th>
              <th className="px-3 py-3 text-center font-medium">Pts</th>
              <th className="px-3 py-3 text-center font-medium">{recentCount} dernier{recentCount === 1 ? "" : "s"}</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((team, index) => (
              <tr key={team.id} className={`border-b border-gray-100 hover:bg-gray-50 ${index < qualifiedCount ? 'border-l-2 border-l-blue-500 bg-blue-50/40' : ''}`}>
                <td className="px-3 py-3 text-center font-medium text-gray-600">{index + 1}</td>
                <td className="max-w-[220px] px-3 py-3 font-medium text-gray-800">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-600">
                      {team.name.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="truncate">{team.name}</span>
                    {index < qualifiedCount && (
                      <span className="shrink-0 text-[10px] font-bold uppercase text-blue-600">Qualifié</span>
                    )}
                    <button type="button" onClick={() => handleDeleteTeam(team)} disabled={loading} className="ml-auto shrink-0 rounded p-1 text-red-600 transition hover:bg-red-50 disabled:opacity-50" title="Supprimer l'equipe" aria-label={"Supprimer " + team.name}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
                <td className="px-2 py-3 text-center font-medium">{team.played}</td>
                <td className="px-2 py-3 text-center">{team.won}</td>
                <td className="px-2 py-3 text-center">{team.drawn}</td>
                <td className="px-2 py-3 text-center">{team.lost}</td>
                <td className="px-2 py-3 text-center">{team.goalsFor}</td>
                <td className="px-2 py-3 text-center">{team.goalsAgainst}</td>
                <td className="px-2 py-3 text-center">{team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}</td>
                <td className="px-3 py-3 text-center font-bold text-blue-700">{team.points}</td>
                <td className="px-3 py-3">
                  <div className="flex justify-center gap-1">
                    {Array.from({ length: recentCount }, (_, resultIndex) => team.recentResults[resultIndex]).map((result, resultIndex) => (
                      <span
                        key={`${team.id}-${resultIndex}`}
                        title={result === 'win' ? 'Victoire' : result === 'draw' ? 'Nul' : result === 'loss' ? 'Defaite' : 'Aucun resultat'}
                        className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white ${
                          result === 'win' ? 'bg-green-600' : result === 'draw' ? 'bg-gray-400' : result === 'loss' ? 'bg-red-500' : 'bg-gray-300'
                        }`}
                      >
                        {result === 'win' ? '\u2713' : result === 'draw' ? '-' : result === 'loss' ? '\u00d7' : '\u00b7'}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
    </div>
  );
}
