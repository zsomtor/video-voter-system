'use client';

import { useState, useEffect } from 'react';

interface Idea {
  id: number;
  title: string;
  thumbnail_text: string;
  description: string | null;
  elo_rating: number;
  vote_count: number;
}

export default function IdeaVote() {
  const [idea1, setIdea1] = useState<Idea | null>(null);
  const [idea2, setIdea2] = useState<Idea | null>(null);
  const [votesRemaining, setVotesRemaining] = useState(15);
  const [totalVotes, setTotalVotes] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [currentResults, setCurrentResults] = useState<any[]>([]);

  useEffect(() => {
    fetchNewPair();
  }, []);

  const fetchNewPair = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/idea-pair');
      if (response.ok) {
        const data = await response.json();
        setIdea1(data.idea1);
        setIdea2(data.idea2);
      } else {
        const error = await response.json();
        alert(error.error || 'Nem találhatók ötletek');
      }
    } catch (error) {
      console.error('Error fetching idea pair:', error);
      alert('Hiba történt az ötletek betöltésekor');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (winnerId: number, loserId: number) => {
    if (!idea1 || !idea2) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/idea-vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winnerId, loserId }),
      });

      if (response.ok) {
        const newVotesRemaining = votesRemaining - 1;
        setVotesRemaining(newVotesRemaining);
        setTotalVotes(totalVotes + 1);

        if (newVotesRemaining === 0) {
          await fetchResults();
          setShowResults(true);
        } else {
          await fetchNewPair();
        }
      } else {
        alert('Hiba történt a szavazás rögzítésekor');
      }
    } catch (error) {
      console.error('Error recording vote:', error);
      alert('Hiba történt a szavazás rögzítésekor');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchResults = async () => {
    try {
      const response = await fetch('/api/idea-rankings');
      if (response.ok) {
        const data = await response.json();
        setCurrentResults(data.ideas);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
    }
  };

  const startNewSession = () => {
    setVotesRemaining(15);
    setTotalVotes(0);
    setShowResults(false);
    fetchNewPair();
  };

  if (showResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-6 text-center">
              💡 Ötlet Rangsor
            </h1>

            <div className="mb-8 text-center">
              <p className="text-lg text-gray-600">
                Összesen {totalVotes} szavazatot adtál le ebben a körben
              </p>
            </div>

            <div className="space-y-4">
              {currentResults.map((idea, index) => (
                <div
                  key={idea.id}
                  className={`p-6 rounded-lg border-2 ${
                    index === 0
                      ? 'bg-green-50 border-green-500'
                      : index === 1
                      ? 'bg-teal-50 border-teal-400'
                      : index === 2
                      ? 'bg-blue-50 border-blue-400'
                      : 'bg-gray-50 border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="text-3xl font-bold text-gray-700">
                        #{idea.rank}
                      </div>
                      {index === 0 && <span className="text-3xl">🏆</span>}
                      {index === 1 && <span className="text-3xl">🥈</span>}
                      {index === 2 && <span className="text-3xl">🥉</span>}
                      <div className="flex-1">
                        <div className="font-semibold text-xl text-gray-900 mb-1">
                          {idea.title}
                        </div>
                        <div className="text-gray-700 mb-2">
                          📸 Thumbnail: <span className="font-medium">{idea.thumbnail_text}</span>
                        </div>
                        {idea.description && (
                          <div className="text-sm text-gray-600 italic">
                            "{idea.description}"
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-3xl font-bold text-green-600">
                        {idea.elo_rating}
                      </div>
                      <div className="text-sm text-gray-500">
                        {idea.vote_count} szavazat
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={startNewSession}
                className="px-8 py-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors text-lg"
              >
                Új Szavazási Kör
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            💡 Videó Ötlet Szavazás
          </h1>
          <p className="text-xl text-gray-600">
            Melyik videóötletet forgassuk le? Szavazz a jobbra!
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="bg-white rounded-full p-2 shadow-md">
            <div
              className="bg-gradient-to-r from-green-500 to-teal-500 h-4 rounded-full transition-all duration-500"
              style={{ width: `${((15 - votesRemaining) / 15) * 100}%` }}
            />
          </div>
          <div className="text-center mt-2 text-gray-700 font-semibold">
            {votesRemaining} szavazat van hátra ebből a körből (15-ből)
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">⏳</div>
            <div className="text-2xl text-gray-600">Betöltés...</div>
          </div>
        ) : idea1 && idea2 ? (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Idea 1 */}
            <div
              onClick={() => handleVote(idea1.id, idea2.id)}
              className="bg-white rounded-2xl shadow-xl p-8 cursor-pointer transform transition-all hover:scale-105 hover:shadow-2xl border-4 border-transparent hover:border-green-500"
            >
              <div className="aspect-video bg-gradient-to-br from-green-400 to-teal-500 rounded-xl mb-6 flex items-center justify-center">
                <div className="text-white text-center p-8">
                  <div className="text-6xl mb-4">💡</div>
                  <div className="text-3xl font-bold">{idea1.thumbnail_text}</div>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">{idea1.title}</h3>
              {idea1.description && (
                <p className="text-gray-600 italic">"{idea1.description}"</p>
              )}
            </div>

            {/* Idea 2 */}
            <div
              onClick={() => handleVote(idea2.id, idea1.id)}
              className="bg-white rounded-2xl shadow-xl p-8 cursor-pointer transform transition-all hover:scale-105 hover:shadow-2xl border-4 border-transparent hover:border-green-500"
            >
              <div className="aspect-video bg-gradient-to-br from-teal-400 to-green-500 rounded-xl mb-6 flex items-center justify-center">
                <div className="text-white text-center p-8">
                  <div className="text-6xl mb-4">💡</div>
                  <div className="text-3xl font-bold">{idea2.thumbnail_text}</div>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">{idea2.title}</h3>
              {idea2.description && (
                <p className="text-gray-600 italic">"{idea2.description}"</p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">😕</div>
            <div className="text-2xl text-gray-600">
              Nincs elérhető ötlet pár. Add hozzá az első ötleteket!
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
