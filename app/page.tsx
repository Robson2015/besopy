'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Trophy } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getPouleMatchSchedule } from '@/lib/tournament';

type Team = { id: number; name: string; poule_id: number };
type Match = {
  created_at?: string;
  schedule_round?: number;
  id: number; stage: string; match_date: string | null; match_time: string | null; terrain: string | null; status: string;
  home_score: number | null; away_score: number | null;
  home_yellow_cards: number; home_red_cards: number; away_yellow_cards: number; away_red_cards: number;
  home_team_id: number; away_team_id: number;
  home_team?: { id: number; name: string; poule_id: number } | null;
  away_team?: { id: number; name: string; poule_id: number } | null;
};
type Standing = Team & { played: number; won: number; drawn: number; lost: number; gf: number; ga: number; points: number; recent: Array<'win' | 'draw' | 'loss'> };

const phases = [
  { id: 'poules', label: 'Phase de poules', short: 'Poules' },
  { id: '16eme', label: '16eme de finale', short: '16eme' },
  { id: '8eme', label: '8eme de finale', short: '8eme' },
  { id: 'quart', label: 'Quart de finale', short: 'Quarts' },
  { id: 'demi', label: 'Demi-finale', short: 'Demis' },
  { id: 'finale', label: 'Finale', short: 'Finale' },
];

export default function Home() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [show16eme, setShow16eme] = useState(false);
  const [activeTab, setActiveTab] = useState('classement');
  const [qualifiedCount, setQualifiedCount] = useState(4);
  const [pouleTerrains, setPouleTerrains] = useState<Record<number, string>>({});

  useEffect(() => {
    let cancelled = false;
    const loadQualificationSetting = async () => {
      let pouleCount = 4;
      try {
        const savedPoules = window.localStorage.getItem('tournament-poules');
        if (savedPoules) pouleCount = JSON.parse(savedPoules).length;
      } catch {
        pouleCount = 4;
      }
      const { data } = await supabase.from('tournament_settings').select('qualified_count, poule_terrains').eq('id', 1).maybeSingle();
      const terrains = data?.poule_terrains;
      if (!cancelled && terrains && typeof terrains === 'object') setPouleTerrains(terrains);
      const localValue = Number(window.localStorage.getItem('tournament-qualified-count') || 4);
      const count = Number(data?.qualified_count ?? localValue);
      if (!cancelled && [2, 4].includes(count)) {
        setQualifiedCount(count);
        setShow16eme(pouleCount * count >= 32);
      }
    };
    loadQualificationSetting();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    async function loadTournament() {
      const [{ data: teamRows, error: teamError }, { data: matchRows, error: matchError }] = await Promise.all([
        supabase.from('teams').select('id, name, poule_id').order('poule_id').order('name'),
        supabase.from('matches').select('*, home_team:teams!matches_home_team_id_fkey(id,name,poule_id), away_team:teams!matches_away_team_id_fkey(id,name,poule_id)').order('created_at'),
      ]);
      if (teamError || matchError) setError('Impossible de charger les donnees du tournoi.');
      setTeams((teamRows || []) as Team[]);
      setMatches((matchRows || []) as Match[]);
      setLoading(false);
    }
    loadTournament();

    const channel = supabase
      .channel('public-matches-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, async () => {
        const { data: matchRows, error: matchError } = await supabase
          .from('matches')
          .select('*, home_team:teams!matches_home_team_id_fkey(id,name,poule_id), away_team:teams!matches_away_team_id_fkey(id,name,poule_id)')
          .order('created_at');
        if (matchError) {
          setError('Impossible de charger les donnees du tournoi.');
          return;
        }
        setMatches((matchRows || []) as Match[]);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_settings' }, async () => {
        const { data } = await supabase.from('tournament_settings').select('poule_terrains').eq('id', 1).maybeSingle();
        if (data?.poule_terrains && typeof data.poule_terrains === 'object') setPouleTerrains(data.poule_terrains);
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const standingsByPoule = useMemo(() => {
    const groups = new Map<number, Standing[]>();
    for (const team of teams) {
      const rows = groups.get(team.poule_id) || [];
      rows.push({ ...team, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0, recent: [] });
      groups.set(team.poule_id, rows);
    }
    for (const match of [...matches].sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''))) {
      if (match.stage !== 'poules' || match.status !== 'completed' || match.home_score === null || match.away_score === null) continue;
      const home = groups.get(match.home_team?.poule_id ?? -1)?.find((team) => team.id === match.home_team_id);
      const away = groups.get(match.away_team?.poule_id ?? -1)?.find((team) => team.id === match.away_team_id);
      if (!home || !away) continue;
      home.played++; away.played++;
      home.gf += match.home_score; home.ga += match.away_score;
      away.gf += match.away_score; away.ga += match.home_score;
      if (match.home_score > match.away_score) { home.won++; home.points += 3; away.lost++; home.recent.push('win'); away.recent.push('loss'); }
      else if (match.home_score < match.away_score) { away.won++; away.points += 3; home.lost++; home.recent.push('loss'); away.recent.push('win'); }
      else { home.drawn++; away.drawn++; home.points++; away.points++; home.recent.push('draw'); away.recent.push('draw'); }
    }
    for (const rows of groups.values()) rows.sort((a, b) => b.points - a.points || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf || a.name.localeCompare(b.name));
    return [...groups.entries()].sort((a, b) => a[0] - b[0]);
  }, [teams, matches]);

  const visiblePhases = phases.filter((phase) => phase.id !== '16eme' || show16eme);
  const completedMatches = matches.filter((match) => match.status === 'completed').length;
  const pouleMatches = getPouleMatchSchedule(teams, matches.filter((match) => match.stage === 'poules'));
  const currentPhase = [...phases].reverse().find((phase) => matches.some((match) => match.stage === phase.id))?.label || (teams.length ? 'Phase de poules' : 'En attente du tournoi');

  return (
    <main className="min-h-screen bg-[#f6f7f4] text-[#18231f]">
      <header className="border-b border-[#dfe5dc] bg-[#fbfcf9]">
        <div className="mx-auto flex max-w-7xl flex-col items-stretch gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-0 sm:py-5 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
          <Image src="/eem.jpg" alt="" width={100} height={100} className="rounded-full object-cover" />
            <span className="flex items-center gap-2 rounded-2xl bg-[#06096c] p-3 text-lg font-black text-white">Besopy</span>
            <span><span className="block text-lg font-black tracking-tight">TOURNOI</span><span className="text-xs uppercase tracking-[0.2em] text-[#68776f]">Foot ball</span></span>
          </Link>
          <Link href="/login" className="w-full rounded-full border border-[#cbd5ca] px-5 py-2.5 text-center text-sm font-bold transition hover:bg-white sm:w-auto">Espace organisateur </Link>
        </div>
      </header>

      <section className="relative overflow-hidden bg-[#173f35] bg-cover bg-center text-white" style={{ backgroundImage: "url('/foot.jpg')" }}>
        <div className="absolute -right-24 -top-40 h-[30rem] w-[30rem] rounded-full border border-white/10" />
        <div className="absolute -right-8 -top-24 h-[22rem] w-[22rem] rounded-full border border-white/10" />
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:px-8 lg:py-24">
          <div className="relative">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.28em] text-[#b8d57e]">Saison en cours · Tableau officiel</p>
            <h1 className="max-w-3xl text-5xl font-black leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">Le tournoi,<br /><span className="text-[#c8e38c]">en direct.</span></h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/70">Classements, resultats et parcours des equipes. Retrouvez ici toutes les phases de la competition.</p>
          </div>
          <div className="relative grid grid-cols-2 gap-3">
            <Stat label="Equipes inscrites" value={String(teams.length)} loading={loading} />
            <Stat label="Matchs joues" value={String(completedMatches)} loading={loading} />
            <div className="col-span-2 rounded-3xl border border-white/10 bg-white/[0.07] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Phase actuelle</p>
              <p className={`mt-2 text-xl font-bold ${loading ? 'h-7 w-40 animate-pulse rounded bg-white/15 text-transparent' : ''}`}>{loading ? 'Chargement...' : currentPhase}</p>
              <div className="mt-5 flex items-center gap-2">
                {visiblePhases.map((phase, index) => {
                  const active = phase.label === currentPhase;
                  return <div key={phase.id} className="flex flex-1 items-center gap-2"><span title={phase.label} className={`h-2 w-full rounded-full ${active ? 'bg-[#c8e38c]' : matches.some((match) => match.stage === phase.id) ? 'bg-white/60' : 'bg-white/15'}`} />{index < phases.length - 1 && <span className="sr-only">{phase.short}</span>}</div>;
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
        <div className="mb-7">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#718078]">Suivez la competition</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight">{activeTab === 'classement' ? 'Classement' : activeTab === 'matchs' ? 'Matchs et resultats' : 'Toutes les phases'}</h2>
        </div>

        <div role="tablist" aria-label="Contenu du tournoi" className="mb-8 flex gap-2 overflow-x-auto border-b border-[#dfe5dc]">
          {[
            { id: 'classement', label: 'Classement' },
            { id: 'matchs', label: 'Matchs' },
            { id: 'phases', label: 'Phases' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 border-b-2 px-5 py-3 text-sm font-bold transition ${activeTab === tab.id ? 'border-[#315745] text-[#315745]' : 'border-transparent text-[#718078] hover:text-[#18231f]'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'classement' && (
          <section>
            <div className="mb-5"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#718078]">Tableaux par poule</p><h3 className="mt-2 text-2xl font-black">Classement des equipes</h3></div>
            {error && <p className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
            {loading ? <SectionSkeleton rows={5} /> : standingsByPoule.length === 0 ? <PanelMessage>Aucune equipe inscrite pour le moment.</PanelMessage> : <div className="space-y-6">{standingsByPoule.map(([pouleId, rows]) => <div key={pouleId} className="overflow-hidden rounded-2xl border border-[#e1e7df] bg-white">
              <div className="flex items-center justify-between border-b border-[#edf0eb] px-5 py-4"><h4 className="font-black">Poule {pouleId}</h4><span className="text-xs text-[#718078]">{rows.length} equipes</span></div>
              <div className="overflow-x-auto"><table className="w-full min-w-[1050px] border-collapse text-sm">
                <thead className="border-y border-[#e1e6ed] bg-white text-xs text-[#354256]">
                  <tr><th className="px-4 py-3 text-left font-medium">#</th><th className="px-4 py-3 text-left font-medium">Club</th><th className="px-3 py-3 text-center font-medium">MJ</th><th className="px-3 py-3 text-center font-medium">G</th><th className="px-3 py-3 text-center font-medium">N</th><th className="px-3 py-3 text-center font-medium">P</th><th className="px-3 py-3 text-center font-medium">BP</th><th className="px-3 py-3 text-center font-medium">BC</th><th className="px-3 py-3 text-center font-medium">DB</th><th className="px-4 py-3 text-center font-medium">Pts</th><th className="px-4 py-3 text-center font-medium">{Math.max(rows.length - 1, 0)} dernier{rows.length === 2 ? "" : "s"}</th></tr>
                </thead>
                <tbody>{rows.map((team, rank) => {
                  const isQualified = rank < qualifiedCount;
                  const recentCount = Math.max(rows.length - 1, 0);
                  return <tr key={team.id} className={`border-b border-[#edf0f5] ${isQualified ? 'bg-[#f7f9fc]' : 'bg-white'}`}>
                    <td className={`border-l-2 px-4 py-4 ${isQualified ? 'border-l-[#2165ff]' : 'border-l-transparent'}`}>{rank + 1}</td>
                    <td className="px-4 py-4"><div className="flex items-center gap-2.5"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#e8ebef] text-[10px] font-bold text-[#526174]">{team.name.slice(0, 2).toUpperCase()}</span><span className="font-medium text-[#26354a]">{team.name}</span>{isQualified && <span className="text-[9px] font-bold uppercase text-[#155eef]">Qualifie</span>}</div></td>
                    <td className="px-3 py-4 text-center">{team.played}</td><td className="px-3 py-4 text-center">{team.won}</td><td className="px-3 py-4 text-center">{team.drawn}</td><td className="px-3 py-4 text-center">{team.lost}</td><td className="px-3 py-4 text-center">{team.gf}</td><td className="px-3 py-4 text-center">{team.ga}</td><td className="px-3 py-4 text-center">{team.gf - team.ga > 0 ? '+' : ''}{team.gf - team.ga}</td><td className="px-4 py-4 text-center font-bold text-[#155eef]">{team.points}</td>
                    <td className="px-4 py-4"><div className="flex justify-center gap-1">{Array.from({ length: recentCount }, (_, index) => team.recent.slice(-recentCount)[index]).map((result, index) => <span key={index} title={result === 'win' ? 'Victoire' : result === 'draw' ? 'Match nul' : result === 'loss' ? 'Defaite' : 'Aucun resultat'} className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold text-white ${result === 'win' ? 'bg-[#08a64b]' : result === 'draw' ? 'bg-[#9aa3b2]' : result === 'loss' ? 'bg-[#f33246]' : 'bg-[#e3e7ed]'}`}>{result === 'win' ? '✓' : result === 'draw' ? '−' : result === 'loss' ? '×' : '·'}</span>)}</div></td>
                  </tr>;
                })}</tbody>
              </table></div>
            </div>)}</div>}
          </section>
        )}

        {activeTab === 'matchs' && (
          <section>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#718078]">Calendrier de la phase</p><h3 className="mt-2 text-2xl font-black">Matchs de poules</h3></div><span className="rounded-full bg-[#e8eee4] px-4 py-2 text-sm font-semibold text-[#43564a]">{pouleMatches.length} matchs</span></div>
            {error && <p className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
            {loading ? <SectionSkeleton rows={4} /> : pouleMatches.length === 0 ? <PanelMessage>Aucun match de poules programme pour le moment.</PanelMessage> : <div className="space-y-8"><section><h4 className="mb-4 text-lg font-bold">Phase de poules</h4><PouleMatchSections matches={pouleMatches} terrains={pouleTerrains} /></section></div>}
          </section>
        )}

        {activeTab === 'phases' && (
          <div>
            {loading && <SectionSkeleton rows={6} />}
            <div className={loading ? 'hidden' : ''}>
            <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {visiblePhases.filter((phase) => phase.id !== 'poules').map((phase, index) => {
                const phaseMatches = matches.filter((match) => match.stage === phase.id);
                const done = phaseMatches.filter((match) => match.status === 'completed').length;
                return <a key={phase.id} href={`#phase-${phase.id}`} className="group flex items-center gap-4 rounded-2xl border border-[#e1e7df] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#a8b99f] hover:shadow-sm">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#edf2e8] text-sm font-black text-[#315745]">{String(index + 1).padStart(2, '0')}</span>
                  <span className="min-w-0 flex-1"><span className="block font-bold">{phase.label}</span><span className="mt-1 block text-sm text-[#718078]">{phaseMatches.length} matchs · {done} termines</span></span><span className="text-[#718078] transition group-hover:translate-x-1">-&gt;</span>
                </a>;
              })}
            </div>
            {visiblePhases.filter((phase) => phase.id !== 'poules').map((phase, index) => {
              const phaseMatches = matches.filter((match) => match.stage === phase.id);
              return <section key={phase.id} id={`phase-${phase.id}`} className="scroll-mt-8 border-t border-[#e1e7df] py-8">
                <div className="mb-5 flex items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#718078]">Phase {String(index + 1).padStart(2, '0')}</p><h3 className="mt-2 text-2xl font-black">{phase.label}</h3></div><span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#56675c]">{phaseMatches.length} matchs</span></div>
                {phaseMatches.length === 0 ? <PanelMessage>Aucun match enregistre pour cette phase.</PanelMessage> : phase.id === 'poules' ? <PouleMatchSections matches={phaseMatches} terrains={pouleTerrains} /> : <div className="grid gap-3 md:grid-cols-2">{phaseMatches.map((match) => <MatchCard key={match.id} match={match} />)}</div>}
              </section>;
            })}
            </div>
          </div>
        )}
      </section>

      <footer className="border-t border-[#e1e7df] bg-white"><div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-sm text-[#718078] sm:flex-row sm:items-center sm:justify-between lg:px-8"><span>Tournoi · Tableau des scores</span><Link href="/login" className="font-bold text-[#315745] hover:underline">Acces organisateur</Link></div></footer>
    </main>
  );
}

function Stat({ label, value, loading = false }: { label: string; value: string; loading?: boolean }) {
  return <div className="rounded-3xl border border-white/10 bg-white/[0.07] p-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-white/50">{label}</p>{loading ? <div className="mt-3 h-9 w-16 animate-pulse rounded bg-white/15" /> : <p className="mt-2 text-3xl font-black">{value}</p>}</div>;
}

function SectionSkeleton({ rows }: { rows: number }) {
  return <div aria-label="Chargement" aria-busy="true" className="space-y-4">{Array.from({ length: rows }, (_, index) => <div key={index} className="h-[76px] animate-pulse rounded-2xl border border-[#e1e7df] bg-white"><div className="flex h-full items-center gap-4 px-5"><span className="h-10 w-10 rounded-xl bg-[#edf2e8]" /><span className="h-4 flex-1 rounded bg-[#edf0eb]" /><span className="h-4 w-20 rounded bg-[#edf0eb]" /></div></div>)}</div>;
}
function PanelMessage({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-[#d7dfd4] bg-white/70 px-5 py-8 text-center text-sm text-[#718078]">{children}</div>;
}

function PouleMatchSections({ matches, terrains }: { matches: Match[]; terrains: Record<number, string> }) {
  const matchesByPoule = new Map<number, Match[]>();
  matches.forEach((match) => {
    const pouleId = match.home_team?.poule_id || 0;
    const pouleMatches = matchesByPoule.get(pouleId) || [];
    pouleMatches.push(match);
    matchesByPoule.set(pouleId, pouleMatches);
  });

  return <div className="space-y-7">{[...matchesByPoule.entries()].sort(([first], [second]) => first - second).map(([pouleId, pouleMatches]) => {
    const matchesByRound = new Map<number, Match[]>();
    pouleMatches.forEach((match) => {
      const round = match.schedule_round || 1;
      const roundMatches = matchesByRound.get(round) || [];
      roundMatches.push(match);
      matchesByRound.set(round, roundMatches);
    });

    return <section key={pouleId}>
      <div className="mb-3 flex items-center justify-between border-b border-[#dfe5dc] pb-2">
        <h4 className="text-lg font-bold text-[#27313b]">Poule {pouleId}</h4>
        {terrains[pouleId] && <span className="text-sm font-medium text-[#56616b]">Terrain : {terrains[pouleId]}</span>}
      </div>
      <div className="space-y-5">{[...matchesByRound.entries()].sort(([first], [second]) => first - second).map(([round, roundMatches]) => (
        <div key={round}>
          <h5 className="mb-2 text-sm font-semibold text-[#56616b]">Tour {round}</h5>
          <div className="grid gap-3 md:grid-cols-2">{roundMatches.map((match) => <MatchCard key={match.id} match={match} />)}</div>
        </div>
      ))}</div>
    </section>;
  })}</div>;
}

function RedCardMark({ count }: { count: number }) {
  if (!count) return null;
  return <span title="Carton rouge" aria-label="Carton rouge" className="inline-block h-3 w-2 shrink-0 rotate-[12deg] rounded-[1px] border border-black/20 bg-red-600" />;
}

function MatchCard({ match }: { match: Match }) {
  const complete = match.status === 'completed';
  const homeWon = complete && match.home_score !== null && match.away_score !== null && match.home_score > match.away_score;
  const awayWon = complete && match.home_score !== null && match.away_score !== null && match.away_score > match.home_score;
  const dateLabel = match.match_date
    ? match.match_date.slice(8, 10) + '/' + match.match_date.slice(5, 7)
    : '--/--';
  const homeName = match.home_team?.name || 'Equipe a definir';
  const awayName = match.away_team?.name || 'Equipe a definir';
  const champion = match.stage === 'finale' && homeWon ? homeName : match.stage === 'finale' && awayWon ? awayName : null;

  return (
    <>
    <article className="grid min-h-[102px] grid-cols-[minmax(0,1fr)_88px] overflow-hidden border-b border-[#cfd4d6] bg-[#e5e7e8] text-[#27313b]">
      <div className="min-w-0 py-3">
        <div className="grid h-9 grid-cols-[minmax(0,1fr)_38px] items-center gap-2 px-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span aria-hidden="true" className="grid h-6 w-6 shrink-0 place-items-center rounded-sm bg-white text-[10px] font-black text-[#52616c] shadow-sm">{homeName.slice(0, 1).toUpperCase()}</span>
            <span className="truncate text-sm">{homeName}</span><RedCardMark count={match.home_red_cards || 0} />
          </div>
          <span className={`text-right text-sm ${homeWon ? 'font-bold' : ''}`}>{complete ? match.home_score : '-'}</span>
        </div>
        <div className="grid h-9 grid-cols-[minmax(0,1fr)_38px] items-center gap-2 px-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span aria-hidden="true" className="grid h-6 w-6 shrink-0 place-items-center rounded-sm bg-white text-[10px] font-black text-[#52616c] shadow-sm">{awayName.slice(0, 1).toUpperCase()}</span>
            <span className="truncate text-sm">{awayName}</span><RedCardMark count={match.away_red_cards || 0} />
          </div>
          <span className={`text-right text-sm ${awayWon ? 'font-bold' : ''}`}>{complete ? match.away_score : '-'}</span>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center border-l border-[#c5cbcd] px-2 text-center">
        <span className="text-xs font-medium">{complete ? 'Termine' : 'A jouer'}</span>
        <span className="mt-1 text-xs text-[#56616b]">{dateLabel}</span>{match.match_time && <span className="mt-1 text-xs font-medium text-[#56616b]">{match.match_time.slice(0, 5)}</span>}{match.terrain && <span className="mt-1 text-xs font-medium text-[#56616b]">Terrain : {match.terrain}</span>}
      </div>

    </article>
          {champion && (
        <article  className="grid min-h-[102px]  overflow-hidden text-[#27313b]">
          <div className="flex items-center justify-center gap-2 rounded-xl border-2 border-[#c89b35] bg-white/80 px-4 py-3 text-center text-[#654b0b] shadow-md">
            <Trophy aria-hidden="true" size={22} className="shrink-0 text-[#bd8b13]" />
            <span className="text-xs font-bold uppercase tracking-[0.18em]">Champion du tournoi Besopy 2027 : Equipe </span>
            <span className="text-base font-black">{champion}</span>
            <Trophy aria-hidden="true" size={22} className="shrink-0 text-[#bd8b13]" />
          </div>
        </article>
      )}
    </>
  );
}
