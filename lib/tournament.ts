import { supabase } from './supabase';

export const POULES = [
  { id: 1, name: 'Poule 1', teams: 5 },
  { id: 2, name: 'Poule 2', teams: 6 },
  { id: 3, name: 'Poule 3', teams: 6 },
  { id: 4, name: 'Poule 4', teams: 6 },
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

export async function getAllTeams() {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .order('poule_id', { ascending: true });
  return { data, error };
}

export async function addMatch(homeTeamId: number, awayTeamId: number, stage: string) {
  const { data, error } = await supabase
    .from('matches')
    .insert([
      {
        home_team_id: homeTeamId,
        away_team_id: awayTeamId,
        stage,
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

export async function getMatches(stage: string) {
  const { data, error } = await supabase
    .from('matches')
    .select(`
      *,
      home_team:teams(id, name, poule_id),
      away_team:teams(id, name, poule_id)
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
