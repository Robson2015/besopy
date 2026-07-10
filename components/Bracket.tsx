'use client';

import { useEffect, useState } from 'react';
import { getMatches, updateMatchScore } from '@/lib/tournament';

interface Match {
  id: number;
  home_team: { id: number; name: string };
  away_team: { id: number; name: string };
  home_score: number | null;
  away_score: number | null;
  status: string;
  stage: string;
}

interface BracketProps {
  stage: string;
  title: string;
}

export default function Bracket({ stage, title }: BracketProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingMatchId, setEditingMatchId] = useState<number | null>(null);
  const [scores, setScores] = useState<{ home: string; away: string }>({ home: '', away: '' });

  useEffect(() => {
    loadMatches();
  }, [stage]);

  const loadMatches = async () => {
    const { data } = await getMatches(stage);
    if (data) setMatches(data);
  };

  const handleSaveScore = async (matchId: number) => {
    const homeScore = parseInt(scores.home);
    const awayScore = parseInt(scores.away);

    if (isNaN(homeScore) || isNaN(awayScore)) return;

    setLoading(true);
    try {
      await updateMatchScore(matchId, homeScore, awayScore);
      loadMatches();
      setEditingMatchId(null);
      setScores({ home: '', away: '' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">{title}</h2>

      <div className="space-y-4">
        {matches.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Aucun match pour cette étape</p>
        ) : (
          matches.map((match) => (
            <div
              key={match.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-gray-800">
                      {match.home_team.name}
                    </span>
                    {match.status === 'completed' ? (
                      <span className="text-lg font-bold text-blue-600">
                        {match.home_score}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-800">
                      {match.away_team.name}
                    </span>
                    {match.status === 'completed' ? (
                      <span className="text-lg font-bold text-blue-600">
                        {match.away_score}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                </div>

                {editingMatchId === match.id ? (
                  <div className="flex gap-2 ml-4">
                    <input
                      type="number"
                      min="0"
                      value={scores.home}
                      onChange={(e) =>
                        setScores({ ...scores, home: e.target.value })
                      }
                      placeholder="0"
                      className="w-12 px-2 py-1 border border-gray-300 rounded text-center"
                    />
                    <span className="px-2 py-1">-</span>
                    <input
                      type="number"
                      min="0"
                      value={scores.away}
                      onChange={(e) =>
                        setScores({ ...scores, away: e.target.value })
                      }
                      placeholder="0"
                      className="w-12 px-2 py-1 border border-gray-300 rounded text-center"
                    />
                    <button
                      onClick={() =>
                        handleSaveScore(match.id)
                      }
                      disabled={loading}
                      className="ml-2 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition"
                    >
                      OK
                    </button>
                    <button
                      onClick={() => {
                        setEditingMatchId(null);
                        setScores({ home: '', away: '' });
                      }}
                      className="bg-gray-400 text-white px-3 py-1 rounded text-sm hover:bg-gray-500 transition"
                    >
                      Annuler
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingMatchId(match.id);
                      setScores({
                        home: match.home_score?.toString() || '',
                        away: match.away_score?.toString() || '',
                      });
                    }}
                    className="ml-4 bg-blue-600 text-white px-4 py-1 rounded text-sm hover:bg-blue-700 transition"
                  >
                    {match.status === 'completed' ? 'Éditer' : 'Saisir'}
                  </button>
                )}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Status: {match.status === 'completed' ? '✓ Terminé' : '⏳ En attente'}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
