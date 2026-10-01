import { supabase } from './supabase';

export const POULES = [
  { id: 1, name: 'Poule 1' },
  { id: 2, name: 'Poule 2' },
  { id: 3, name: 'Poule 3' },
  { id: 4, name: 'Poule 4' },
];

export async function addTeam(poulesId: number, name: string, userId: string) {
  const { data, error } = await supabase
    .from('teams')
    .insert([
      {
        poule_id: poulesId,
        name,
        user_id: userId,
        points: 0,
      },
    ])
    .select();
  return { data, error };
}

export async function getTeams(poulesId: number) {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('poule_id', poulesId)
    .order('points', { ascending: false });
  return { data, error };
}

export async function deleteTeam(teamId: number, userId: string) {
  const { data, error } = await supabase
    .from('teams')
    .delete()
    .eq('id', teamId)
    .eq('user_id', userId)
    .select();
  return { data, error };
}

export async function deleteTeamsByPoule(poulesId: number, userId: string) {
  const { data, error } = await supabase
    .from('teams')
    .delete()
    .eq('poule_id', poulesId)
    .eq('user_id', userId)
    .select();
  return { data, error };
}

export async function getAllTeams() {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .order('poule_id', { ascending: true });
  return { data, error };
}

export async function addMatch(homeTeamId: number, awayTeamId: number, stage: string, matchDate?: string, terrain?: string, matchTime?: string) {
  const { data, error } = await supabase
    .from('matches')
    .insert([
      {
        home_team_id: homeTeamId,
        away_team_id: awayTeamId,
        stage,
        match_date: matchDate || null,
        match_time: matchTime || null,
        terrain: terrain?.trim() || null,
        home_score: null,
        away_score: null,
        status: 'pending',
      },
    ])
    .select();
  return { data, error };
}

export async function updateMatchScore(matchId: number, homeScore: number, awayScore: number) {
  const { data, error } = await supabase
    .from('matches')
    .update({
      home_score: homeScore,
      away_score: awayScore,
      status: 'completed',
    })
    .eq('id', matchId)
    .select();
  return { data, error };
}

export async function updateMatchSchedule(matchId: number, matchDate: string | null, matchTime: string | null) {
  const { data, error } = await supabase
    .from('matches')
    .update({ match_date: matchDate, match_time: matchTime })
    .eq('id', matchId)
    .select();
  return { data, error };
}

export async function updateMatchCards(matchId: number, cards: Partial<{
  home_yellow_cards: number;
  home_red_cards: number;
  away_yellow_cards: number;
  away_red_cards: number;
}>) {
  const { data, error } = await supabase
    .from('matches')
    .update(cards)
    .eq('id', matchId)
    .select();
  return { data, error };
}

export async function deleteMatch(matchId: number) {
  const { data, error } = await supabase
    .from('matches')
    .delete()
    .eq('id', matchId)
    .select();
  return { data, error };
}

export async function deleteMatchesByStage(stage: string) {
  const { data, error } = await supabase
    .from('matches')
    .delete()
    .eq('stage', stage)
    .select();
  return { data, error };
}

export async function getMatches(stage: string) {
  const { data, error } = await supabase
    .from('matches')
    .select(`
      *,
      home_team:teams!matches_home_team_id_fkey(id, name, poule_id),
      away_team:teams!matches_away_team_id_fkey(id, name, poule_id)
    `)
    .eq('stage', stage)
    .order('created_at', { ascending: true });
  return { data, error };
}

export function getPouleMatchSchedule<T extends { id: number; home_team_id: number; away_team_id: number }>(
  teams: Array<{ id: number; poule_id: number }>,
  matches: T[]
) {
  const teamsByPoule = new Map<number, number[]>();
  teams.forEach((team) => {
    const group = teamsByPoule.get(team.poule_id) || [];
    group.push(team.id);
    teamsByPoule.set(team.poule_id, group);
  });

  const matchesByPair = new Map<string, T>();
  matches.forEach((match) => {
    const pairKey = [match.home_team_id, match.away_team_id].sort((first, second) => first - second).join(':');
    matchesByPair.set(pairKey, match);
  });

  const roundsByPoule = new Map<number, T[][]>();
  teamsByPoule.forEach((teamIds, pouleId) => {
    const rotation: Array<number | null> = [...teamIds.sort((first, second) => first - second)];
    if (rotation.length % 2 === 1) rotation.push(null);

    const rounds: T[][] = [];
    for (let roundIndex = 0; roundIndex < rotation.length - 1; roundIndex++) {
      const round: T[] = [];
      for (let matchIndex = 0; matchIndex < rotation.length / 2; matchIndex++) {
        const firstTeamId = rotation[matchIndex];
        const secondTeamId = rotation[rotation.length - 1 - matchIndex];
        if (firstTeamId === null || secondTeamId === null) continue;

        const pairKey = [firstTeamId, secondTeamId].sort((first, second) => first - second).join(':');
        const match = matchesByPair.get(pairKey);
        if (match) round.push(match);
      }
      rounds.push(round);
      rotation.splice(1, 0, rotation.pop()!);
    }
    roundsByPoule.set(pouleId, rounds);
  });

  const pouleIds = [...roundsByPoule.keys()].sort((first, second) => first - second);
  const orderedMatches: Array<T & { schedule_round: number }> = [];
  pouleIds.forEach((pouleId) => {
    (roundsByPoule.get(pouleId) || []).forEach((round, roundIndex) => {
      round.forEach((match) => {
        orderedMatches.push({ ...match, schedule_round: roundIndex + 1 });
      });
    });
  });

  const orderedIds = new Set(orderedMatches.map((match) => match.id));
  const unassignedMatches = matches
    .filter((match) => !orderedIds.has(match.id))
    .map((match) => ({ ...match, schedule_round: 1 }));
  return [...orderedMatches, ...unassignedMatches];
}

export async function updateMatchScheduleOrder(updates: Array<{ id: number; schedule_order: number }>) {
  const errors = await Promise.all(updates.map(async (update) => {
    const { error } = await supabase
      .from('matches')
      .update({ schedule_order: update.schedule_order })
      .eq('id', update.id);
    return error;
  }));
  return { error: errors.find(Boolean) || null };
}

export async function updateTeamPoints(teamId: number, points: number) {
  const { data, error } = await supabase
    .from('teams')
    .update({ points })
    .eq('id', teamId)
    .select();
  return { data, error };
}
