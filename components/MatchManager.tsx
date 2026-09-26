'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import { Minus, Trash2 } from 'lucide-react';
import { getAllTeams, addMatch, getMatches, updateMatchScore, updateMatchCards, deleteMatch, deleteMatchesByStage } from '@/lib/tournament';

interface Team {
  id: number;
  name: string;
  poule_id: number;
  user_id: string;
}

interface Match {
  id: number;
  home_team_id: number;
  away_team_id: number;
  stage: string;
  match_date: string | null;
  home_score: number | null;
  away_score: number | null;
  home_yellow_cards: number;
  home_red_cards: number;
  away_yellow_cards: number;
  away_red_cards: number;
  status: string;
  home_team?: { name: string; poule_id: number };
  away_team?: { name: string };
}

interface GroupMatch {
  home_team_id: number;
  away_team_id: number;
  home_score: number | null;
  away_score: number | null;
  status: string;
}

interface MatchManagerProps {
  stage: string;
  title: string;
  userId: string;
  qualifiedCount?: number;
  initialPhase?: boolean;
}

export default function MatchManager({ stage, title, userId, qualifiedCount = 2, initialPhase = false }: MatchManagerProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [qualifiedTeamIds, setQualifiedTeamIds] = useState<number[] | null>(null);
  const [homeTeamId, setHomeTeamId] = useState('');
  const [awayTeamId, setAwayTeamId] = useState('');
  const [matchDate, setMatchDate] = useState('');
  const [editingMatchId, setEditingMatchId] = useState<number | null>(null);
  const [scores, setScores] = useState({ home: '', away: '' });
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [stage, initialPhase, qualifiedCount, userId]);

  const loadingData = useRef(false);

  const loadData = async () => {
    if (loadingData.current) return;
    loadingData.current = true;
    try {
      const { data: teamsData } = await getAllTeams();
      const ownedTeams = (teamsData || []).filter((team: Team) => team.user_id === userId);
      setTeams(ownedTeams);
      const ownedTeamIds = new Set(ownedTeams.map((team) => team.id));

      if (stage === 'poules' && ownedTeams.length > 1) {
        const { data: currentGroupMatches } = await getMatches('poules');
        const existingPairs = new Set((currentGroupMatches || []).map((match: Match) => {
          return [match.home_team_id, match.away_team_id].sort((a, b) => a - b).join(':');
        }));
        const teamsByPoule = new Map<number, Team[]>();
        ownedTeams.forEach((team) => {
          const group = teamsByPoule.get(team.poule_id) || [];
          group.push(team);
          teamsByPoule.set(team.poule_id, group);
        });

        const newPairings: Array<[Team, Team]> = [];
        teamsByPoule.forEach((group) => {
          for (let first = 0; first < group.length; first++) {
            for (let second = first + 1; second < group.length; second++) {
              const pairKey = [group[first].id, group[second].id].sort((a, b) => a - b).join(':');
              if (!existingPairs.has(pairKey)) {
                existingPairs.add(pairKey);
                newPairings.push([group[first], group[second]]);
              }
            }
          }
        });

        const created = await Promise.all(newPairings.map(([home, away]) => addMatch(home.id, away.id, 'poules')));
        if (created.some((result) => result.error)) {
          console.error('Unable to generate all group matches', created.filter((result) => result.error));
        }
      }

      if (initialPhase && teamsData) {
        const { data: groupMatches } = await getMatches('poules');
        if (groupMatches) {
          setQualifiedTeamIds(getQualifiedTeamIds(ownedTeams, groupMatches.filter((match: Match) => ownedTeamIds.has(match.home_team_id) && ownedTeamIds.has(match.away_team_id)), qualifiedCount));
        }
      } else if (stage === '8eme' || stage === 'quart' || stage === 'demi' || stage === 'finale') {
        const previousStage = stage === '8eme' ? '16eme' : stage === 'quart' ? '8eme' : stage === 'demi' ? 'quart' : 'demi';
        const { data: previousPhaseMatches } = await getMatches(previousStage);
        if (previousPhaseMatches) {
          setQualifiedTeamIds(getWinningTeamIds(previousPhaseMatches.filter((match: Match) => ownedTeamIds.has(match.home_team_id) && ownedTeamIds.has(match.away_team_id))));
        } else {
          setQualifiedTeamIds([]);
        }
      } else {
        setQualifiedTeamIds(null);
      }

      const { data: matchesData } = await getMatches(stage);
      if (matchesData) {
        const ownMatches = matchesData.filter((match: Match) => ownedTeamIds.has(match.home_team_id) && ownedTeamIds.has(match.away_team_id));
        const orderedMatches = stage === 'poules'
          ? [...ownMatches].sort((first, second) => (first.home_team?.poule_id || 0) - (second.home_team?.poule_id || 0))
          : ownMatches;
        setMatches(orderedMatches);
      }
    } finally {
      loadingData.current = false;
      setDataLoading(false);
    }
  };

  const selectableTeams = qualifiedTeamIds
    ? teams.filter((team) => qualifiedTeamIds.includes(team.id))
    : teams;

  const handleAddMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeTeamId || !awayTeamId || homeTeamId === awayTeamId) return;

    setLoading(true);
    try {
      const { data, error } = await addMatch(
        parseInt(homeTeamId),
        parseInt(awayTeamId),
        stage,
        matchDate
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
        setMatchDate('');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveScore = async (matchId: number) => {
    const homeScore = Number(scores.home);
    const awayScore = Number(scores.away);
    if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore) || homeScore < 0 || awayScore < 0) return;

    setLoading(true);
    try {
      const { error } = await updateMatchScore(matchId, homeScore, awayScore);
      if (error) {
        alert('Erreur lors de l\'enregistrement du résultat');
        return;
      }
      await loadData();
      setEditingMatchId(null);
      setScores({ home: '', away: '' });
    } finally {
      setLoading(false);
    }
  };

  const handleCardChange = async (match: Match, field: 'home_yellow_cards' | 'home_red_cards' | 'away_yellow_cards' | 'away_red_cards', change: number) => {
    const currentCount = match[field] || 0;
    const count = Math.max(0, currentCount + change);
    if (count === currentCount) return;
    const { error } = await updateMatchCards(match.id, { [field]: count });
    if (error) {
      alert('Erreur lors de l’enregistrement du carton. Vérifiez que la migration Supabase a été appliquée.');
      return;
    }
    setMatches((current) => current.map((item) => item.id === match.id ? { ...item, [field]: count } : item));
  };

  const handleDeleteMatch = async (matchId: number) => {
    if (!window.confirm('Supprimer ce match ?')) return;

    setLoading(true);
    try {
      const { error } = await deleteMatch(matchId);
      if (error) {
        alert('Erreur lors de la suppression du match');
        return;
      }
      await loadData();
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAllMatches = async () => {
    if (!matches.length || !window.confirm(`Supprimer les ${matches.length} matchs de cette phase ?`)) return;

    setLoading(true);
    try {
      const { error } = await deleteMatchesByStage(stage);
      if (error) {
        alert('Erreur lors de la suppression des matchs');
        return;
      }
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">{title} </h2>

      {/* Add Match Form */}
      <div className={stage === 'poules' ? 'mb-8 rounded-lg bg-blue-50 p-4' : 'mb-8 p-4 bg-gray-50 rounded-lg'}>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">{stage === 'poules' ? 'Calendrier genere automatiquement par poule' : 'Creer un match'}</h3>
        {stage === 'poules' && <p className="text-sm text-blue-700">Tous les matchs sont crees automatiquement. Il ne reste qu a saisir les scores.</p>}
        {stage !== 'poules' && <form onSubmit={handleAddMatch} className="flex gap-2 flex-wrap">
          <select
            value={homeTeamId}
            onChange={(e) => setHomeTeamId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">Équipe 1</option>
            {selectableTeams.map((team) => (
              <option key={team.id} value={team.id}>
                Poule {team.poule_id} - {team.name}
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
            {selectableTeams.map((team) => (
              <option key={team.id} value={team.id}>
                Poule {team.poule_id} - {team.name}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={matchDate}
            onChange={(e) => setMatchDate(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
            aria-label="Date du match"
          />

          <button
            type="submit"
            disabled={loading || !homeTeamId || !awayTeamId}
            className="bg-green-600 text-white px-6 py-2 rounded font-semibold hover:bg-green-700 transition disabled:opacity-50"
          >
            {loading ? 'Ajout...' : 'Ajouter Match'}
          </button>
        </form>}
      </div>

      {/* Matches List */}
      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-gray-700">Matchs ({matches.length})</h3>
          {matches.length > 0 && (
            <button
              type="button"
              onClick={handleDeleteAllMatches}
              disabled={loading}
              className="rounded bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              Supprimer tous les matchs
            </button>
          )}
        </div>
        {matches.length === 0 ? (dataLoading ? <div aria-label="Chargement des matchs" aria-busy="true" className="space-y-3">{Array.from({ length: 3 }, (_, index) => <div key={index} className="h-[58px] animate-pulse rounded border border-gray-200 bg-gray-50" />)}</div> : (
          <p className="text-gray-500 text-center py-4">Aucun match créé</p>
        )) : (
          <div className="space-y-3">
            {matches.map((match, index) => (
              <Fragment key={match.id}>
                {stage === 'poules' && (index === 0 || matches[index - 1].home_team?.poule_id !== match.home_team?.poule_id) && (
                  <h4 className="pt-3 text-lg font-bold text-gray-800">Poule {match.home_team?.poule_id}</h4>
                )}
                <div className="rounded border border-gray-200 bg-gray-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-wrap items-start gap-x-2 gap-y-1">
                    <span className="mr-1 text-sm font-semibold text-gray-600">Match {index + 1}</span>
                    <span className="inline-flex flex-col items-center gap-0.5 text-center font-semibold">{match.home_team?.name || 'Equipe'}<CardControls yellow={match.home_yellow_cards || 0} red={match.home_red_cards || 0} onYellow={(change) => handleCardChange(match, 'home_yellow_cards', change)} onRed={(change) => handleCardChange(match, 'home_red_cards', change)} /></span>
                    <span className="text-gray-500">vs</span>
                    <span className="inline-flex flex-col items-center gap-0.5 text-center font-semibold">{match.away_team?.name || 'Equipe'}<CardControls yellow={match.away_yellow_cards || 0} red={match.away_red_cards || 0} onYellow={(change) => handleCardChange(match, 'away_yellow_cards', change)} onRed={(change) => handleCardChange(match, 'away_red_cards', change)} /></span>
                    {match.match_date && <span className="text-sm text-gray-500">{match.match_date}</span>}
                  </div>
                  {['poules', '16eme', '8eme', 'quart', 'demi', 'finale'].includes(stage) && (editingMatchId === match.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={scores.home}
                        onChange={(e) => setScores({ ...scores, home: e.target.value })}
                        className="w-14 rounded border border-gray-300 px-2 py-1 text-center"
                        aria-label="Buts équipe 1"
                      />
                      <span>-</span>
                      <input
                        type="number"
                        min="0"
                        value={scores.away}
                        onChange={(e) => setScores({ ...scores, away: e.target.value })}
                        className="w-14 rounded border border-gray-300 px-2 py-1 text-center"
                        aria-label="Buts équipe 2"
                      />
                      <button onClick={() => handleSaveScore(match.id)} disabled={loading} className="rounded bg-green-600 px-3 py-1 text-sm font-semibold text-white">
                        OK
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-blue-700">
                        {match.status === 'completed' ? `${match.home_score} - ${match.away_score}` : 'À jouer'}
                      </span>
                      <button
                        onClick={() => {
                          setEditingMatchId(match.id);
                          setScores({ home: match.home_score?.toString() || '', away: match.away_score?.toString() || '' });
                        }}
                        className="rounded bg-blue-600 px-3 py-1 text-sm font-semibold text-white"
                      >
                        {match.status === 'completed' ? 'Modifier' : 'Résultat'}
                      </button>
                      <button
                        onClick={() => handleDeleteMatch(match.id)}
                        disabled={loading}
                        className="inline-flex items-center gap-1 rounded bg-red-600 px-3 py-1 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                        title="Supprimer le match"
                      >
                        <Trash2 size={14} />
                        Supprimer
                      </button>
                    </div>
                  ))}
                </div>
                </div>
              </Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CardControls({ yellow, red, onYellow, onRed }: { yellow: number; red: number; onYellow: (change: number) => void; onRed: (change: number) => void }) {
  const control = (color: 'yellow' | 'red', count: number, onChange: (change: number) => void) => (
    <span className="inline-flex items-center gap-0.5">
      <button type="button" onClick={() => onChange(1)} className="inline-flex items-center gap-1 rounded px-1 py-0.5 text-xs text-gray-600 hover:bg-gray-200" title={'Ajouter un carton ' + (color === 'yellow' ? 'jaune' : 'rouge')} aria-label={'Ajouter un carton ' + (color === 'yellow' ? 'jaune' : 'rouge')}>
        <span aria-hidden="true" className={'h-3 w-2 rotate-[12deg] rounded-[1px] border border-black/20 ' + (color === 'yellow' ? 'bg-yellow-400' : 'bg-red-600')} />{count}
      </button>
      {count > 0 && <button type="button" onClick={() => onChange(-1)} className="rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700" title="Annuler le dernier carton" aria-label="Annuler le dernier carton"><Minus size={12} /></button>}
    </span>
  );
  return <span className="inline-flex items-center gap-1">{control('yellow', yellow, onYellow)}{control('red', red, onRed)}</span>;
}

function getQualifiedTeamIds(teams: Team[], matches: GroupMatch[], qualifiedCount: number) {
  const standings = new Map<number, {
    points: number;
    goalDifference: number;
    goalsFor: number;
  }>();

  teams.forEach((team) => {
    standings.set(team.id, { points: 0, goalDifference: 0, goalsFor: 0 });
  });

  matches.forEach((match) => {
    if (match.status !== 'completed' || match.home_score === null || match.away_score === null) return;

    const home = standings.get(match.home_team_id);
    const away = standings.get(match.away_team_id);
    if (!home || !away) return;

    home.goalsFor += match.home_score;
    away.goalsFor += match.away_score;
    home.goalDifference += match.home_score - match.away_score;
    away.goalDifference += match.away_score - match.home_score;

    if (match.home_score > match.away_score) home.points += 3;
    else if (match.home_score < match.away_score) away.points += 3;
    else {
      home.points += 1;
      away.points += 1;
    }
  });

  return teams
    .reduce<number[][]>((groups, team) => {
      const group = groups.find((groupTeamIds) => {
        const firstTeam = teams.find((candidate) => candidate.id === groupTeamIds[0]);
        return firstTeam?.poule_id === team.poule_id;
      });
      if (group) group.push(team.id);
      else groups.push([team.id]);
      return groups;
    }, [])
    .flatMap((group) => group
      .sort((firstId, secondId) => {
        const first = standings.get(firstId)!;
        const second = standings.get(secondId)!;
        return second.points - first.points ||
          second.goalDifference - first.goalDifference ||
          second.goalsFor - first.goalsFor;
      })
      .slice(0, qualifiedCount)
    );
}

function getWinningTeamIds(matches: GroupMatch[]) {
  return matches.reduce<number[]>((winners, match) => {
    if (match.status !== 'completed' || match.home_score === null || match.away_score === null) {
      return winners;
    }

    if (match.home_score > match.away_score) winners.push(match.home_team_id);
    if (match.away_score > match.home_score) winners.push(match.away_team_id);
    return winners;
  }, []);
}
