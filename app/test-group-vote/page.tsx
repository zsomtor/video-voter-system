'use client';

import { useState, useEffect } from 'react';
import { calculateElo } from '@/lib/elo';

interface Video {
  id: number;
  title: string;
  thumbnail_text: string;
  thumbnail_url: string | null;
  test_group_elo: number;
  test_group_vote_count: number;
  test_group_id: string;
}

export default function TestGroupVote() {
  const [video1, setVideo1] = useState<Video | null>(null);
  const [video2, setVideo2] = useState<Video | null>(null);
  const [testGroupId, setTestGroupId] = useState<string>('');
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
      const response = await fetch('/api/test-group-pair');
      if (response.ok) {
        const data = await response.json();
        setVideo1(data.video1);
        setVideo2(data.video2);
        setTestGroupId(data.testGroupId);
      } else {
        const error = await response.json();
        alert(error.error || 'Nem találhatók test group videók');
      }
    } catch (error) {
      console.error('Error fetching test group pair:', error);
      alert('Hiba történt a videók betöltésekor');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (winnerId: number, loserId: number) => {
    if (!video1 || !video2) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/test-group-vote', {
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
      const response = await fetch('/api/rankings');
      if (response.ok) {
        const data = await response.json();
        // Filter to only videos with test_group_id
        const testGroupVideos = data.rankings.filter((v: any) => v.test_group_id);
        setCurrentResults(testGroupVideos);
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
    // Group results by test_group_id
    const groupedResults = new Map<string, any[]>();
    currentResults.forEach((video) => {
      const groupId = video.test_group_id;
      if (!groupedResults.has(groupId)) {
        groupedResults.set(groupId, []);
      }
      groupedResults.get(groupId)!.push(video);
    });

    // Sort each group by test_group_elo
    groupedResults.forEach((videos) => {
      videos.sort((a, b) => b.test_group_elo - a.test_group_elo);
    });

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-6 text-center">
              🧪 A/B Test Eredmények
            </h1>

            <div className="mb-8 text-center">
              <p className="text-lg text-gray-600">
                Összesen {totalVotes} szavazatot adtál le ebben a körben
              </p>
            </div>

            {Array.from(groupedResults.entries()).map(([groupId, videos]) => (
              <div key={groupId} className="mb-8">
                <h2 className="text-2xl font-bold text-gray-700 mb-4">
                  🧪 Test Group: {groupId}
                </h2>
                <div className="space-y-4">
                  {videos.map((video, index) => (
                    <div
                      key={video.id}
                      className={`p-4 rounded-lg border-2 ${
                        index === 0
                          ? 'bg-green-50 border-green-500'
                          : index === 1
                          ? 'bg-blue-50 border-blue-400'
                          : index === 2
                          ? 'bg-orange-50 border-orange-400'
                          : 'bg-gray-50 border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-3xl font-bold text-gray-700">
                            #{index + 1}
                          </div>
                          {index === 0 && <span className="text-2xl">🏆</span>}
                          {index === 1 && <span className="text-2xl">🥈</span>}
                          {index === 2 && <span className="text-2xl">🥉</span>}
                          <div>
                            <div className="font-semibold text-lg">{video.title}</div>
                            <div className="text-sm text-gray-600">
                              {video.thumbnail_text}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-800">
                            {video.test_group_elo}
                          </div>
                          <div className="text-sm text-gray-500">
                            {video.test_group_vote_count} test szavazat
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="mt-8 text-center">
              <button
                onClick={startNewSession}
                className="px-8 py-4 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors text-lg"
              >
                Új Test Kör Indítása
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            🧪 A/B Test Szavazás
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Hasonlítsd össze az azonos test group videóit!
          </p>
          {testGroupId && (
            <div className="inline-block bg-orange-200 text-orange-900 px-6 py-2 rounded-full font-semibold text-lg">
              Test Group: {testGroupId}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="bg-white rounded-full p-2 shadow-md">
            <div
              className="bg-gradient-to-r from-orange-500 to-red-500 h-4 rounded-full transition-all duration-500"
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
        ) : video1 && video2 ? (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Video 1 */}
            <div
              onClick={() => handleVote(video1.id, video2.id)}
              className="bg-white rounded-2xl shadow-xl p-8 cursor-pointer transform transition-all hover:scale-105 hover:shadow-2xl border-4 border-transparent hover:border-orange-500"
            >
              <div className="aspect-video bg-gradient-to-br from-orange-400 to-red-500 rounded-xl mb-6 flex items-center justify-center">
                {video1.thumbnail_url ? (
                  <img
                    src={video1.thumbnail_url}
                    alt={video1.title}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <div className="text-white text-center p-8">
                    <div className="text-4xl font-bold mb-4">{video1.thumbnail_text}</div>
                  </div>
                )}
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">{video1.title}</h3>
              <div className="flex items-center justify-between">
                <div className="text-gray-600">Test ELO: {video1.test_group_elo}</div>
                <div className="text-sm text-gray-500">
                  {video1.test_group_vote_count} test szavazat
                </div>
              </div>
            </div>

            {/* Video 2 */}
            <div
              onClick={() => handleVote(video2.id, video1.id)}
              className="bg-white rounded-2xl shadow-xl p-8 cursor-pointer transform transition-all hover:scale-105 hover:shadow-2xl border-4 border-transparent hover:border-orange-500"
            >
              <div className="aspect-video bg-gradient-to-br from-orange-400 to-red-500 rounded-xl mb-6 flex items-center justify-center">
                {video2.thumbnail_url ? (
                  <img
                    src={video2.thumbnail_url}
                    alt={video2.title}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <div className="text-white text-center p-8">
                    <div className="text-4xl font-bold mb-4">{video2.thumbnail_text}</div>
                  </div>
                )}
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">{video2.title}</h3>
              <div className="flex items-center justify-between">
                <div className="text-gray-600">Test ELO: {video2.test_group_elo}</div>
                <div className="text-sm text-gray-500">
                  {video2.test_group_vote_count} test szavazat
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">😕</div>
            <div className="text-2xl text-gray-600">
              Nincs elérhető test group videó pár
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
