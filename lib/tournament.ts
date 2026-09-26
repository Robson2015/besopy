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

export async function addMatch(homeTeamId: number, awayTeamId: number, stage: string, matchDate?: string) {
  const { data, error } = await supabase
    .from('matches')
    .insert([
      {
        home_team_id: homeTeamId,
        away_team_id: awayTeamId,
        stage,
        match_date: matchDate || null,
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

export async function updateTeamPoints(teamId: number, points: number) {
  const { data, error } = await supabase
    .from('teams')
    .update({ points })
    .eq('id', teamId)
    .select();
  return { data, error };
}
