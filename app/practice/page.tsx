'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { Video } from '@/lib/db';

export default function PracticePage() {
  const [videoA, setVideoA] = useState<Video | null>(null);
  const [videoB, setVideoB] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [totalVotes, setTotalVotes] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<Video | null>(null);
  const [actualWinner, setActualWinner] = useState<Video | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch a new pair of training videos
  const fetchNewPair = async () => {
    setLoading(true);
    setError(null);
    setShowResult(false);
    setSelectedWinner(null);
    setActualWinner(null);

    try {
      const response = await fetch('/api/practice-pair');
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Sikertelen videó betöltés');
        return;
      }

      setVideoA(data.videoA);
      setVideoB(data.videoB);
    } catch (err) {
      setError('Hálózati hiba. Kérlek próbáld újra.');
      console.error('Error fetching practice pair:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle practice vote (doesn't save to database)
  const handlePracticeVote = async (winnerId: number, loserId: number) => {
    if (!videoA || !videoB) return;

    setVoting(true);

    // Determine which video was selected
    const selected = winnerId === videoA.id ? videoA : videoB;
    const other = winnerId === videoA.id ? videoB : videoA;

    // Determine actual winner based on real views
    const actualWin = videoA.actual_views! > videoB.actual_views! ? videoA : videoB;

    setSelectedWinner(selected);
    setActualWinner(actualWin);
    setShowResult(true);
    setTotalVotes(prev => prev + 1);
    setVoting(false);
  };

  // Load next pair
  const handleNext = () => {
    fetchNewPair();
  };

  // Load initial pair on mount
  useEffect(() => {
    fetchNewPair();
  }, []);

  if (loading && !videoA) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Betöltés...</p>
        </div>
      </div>
    );
  }

  if (error && !videoA) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
          <p className="text-gray-600 mb-4">
            A gyakorló módhoz adj hozzá legalább 2 saját videót ismert nézettséggel!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8 px-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="text-center mb-4">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📚 Gyakorló Mód
          </h1>
          <p className="text-gray-600 text-lg">
            Gyakorolj a saját videóidon - a végén láthatod a helyes választ!
          </p>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
          <div className="bg-white px-4 py-2 rounded-full shadow">
            <span className="font-semibold text-green-600">{totalVotes}</span> gyakorló szavazat
          </div>
          <a
            href="/"
            className="bg-white px-4 py-2 rounded-full shadow hover:shadow-md transition"
          >
            🗳️ Éles szavazás
          </a>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-blue-800">
            💡 <strong>Tipp:</strong> Ezek a Bazu podcast valódi epizódjai.
            Szavazz arra, amelyikre szerinted többen kattintottak, majd nézd meg a valós eredményt!
          </p>
        </div>
      </div>

      {/* Voting Interface */}
      {videoA && videoB && !showResult && (
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Video A */}
            <button
              onClick={() => handlePracticeVote(videoA.id, videoB.id)}
              disabled={voting}
              className="group relative bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed p-8"
            >
              <div className="absolute top-4 left-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                A
              </div>

              <div className="mt-8 mb-6">
                {/* Guest Name */}
                {videoA.guest_name && (
                  <div className="text-center mb-4">
                    <span className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold">
                      🎙️ {videoA.guest_name}
                    </span>
                  </div>
                )}

                {/* Thumbnail */}
                <div className="mb-4">
                  {videoA.thumbnail_url ? (
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={videoA.thumbnail_url}
                        alt={videoA.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover"
                        priority
                      />
                      {/* Overlay with thumbnail text */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-10 transition">
                        <div className="text-white text-2xl font-bold opacity-0 hover:opacity-100 transition">
                          {videoA.thumbnail_text}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-green-100 to-blue-100 rounded-lg p-12">
                      <div className="text-center">
                        <div className="text-6xl mb-4">🎬</div>
                        <div className="text-2xl font-bold text-gray-800">
                          {videoA.thumbnail_text}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
                  {videoA.title}
                </h3>
              </div>

              <div className="text-green-600 font-semibold group-hover:text-green-700">
                Ez kapott több nézettséget
              </div>
            </button>

            {/* Video B */}
            <button
              onClick={() => handlePracticeVote(videoB.id, videoA.id)}
              disabled={voting}
              className="group relative bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed p-8"
            >
              <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                B
              </div>

              <div className="mt-8 mb-6">
                {/* Guest Name */}
                {videoB.guest_name && (
                  <div className="text-center mb-4">
                    <span className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold">
                      🎙️ {videoB.guest_name}
                    </span>
                  </div>
                )}

                {/* Thumbnail */}
                <div className="mb-4">
                  {videoB.thumbnail_url ? (
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={videoB.thumbnail_url}
                        alt={videoB.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover"
                        priority
                      />
                      {/* Overlay with thumbnail text */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-10 transition">
                        <div className="text-white text-2xl font-bold opacity-0 hover:opacity-100 transition">
                          {videoB.thumbnail_text}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-blue-100 to-green-100 rounded-lg p-12">
                      <div className="text-center">
                        <div className="text-6xl mb-4">🎬</div>
                        <div className="text-2xl font-bold text-gray-800">
                          {videoB.thumbnail_text}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
                  {videoB.title}
                </h3>
              </div>

              <div className="text-blue-600 font-semibold group-hover:text-blue-700">
                Ez kapott több nézettséget
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Result Display */}
      {showResult && selectedWinner && actualWinner && videoA && videoB && (
        <div className="max-w-4xl mx-auto">
          {/* Result Card */}
          <div className={`rounded-xl shadow-2xl p-8 mb-6 ${
            selectedWinner.id === actualWinner.id
              ? 'bg-green-50 border-4 border-green-500'
              : 'bg-red-50 border-4 border-red-500'
          }`}>
            <div className="text-center mb-6">
              {selectedWinner.id === actualWinner.id ? (
                <>
                  <div className="text-6xl mb-4">🎉</div>
                  <h2 className="text-3xl font-bold text-green-800 mb-2">
                    Helyes!
                  </h2>
                  <p className="text-green-700 text-lg">
                    Jól érezted, hogy melyik packaging teljesít jobban!
                  </p>
                </>
              ) : (
                <>
                  <div className="text-6xl mb-4">🤔</div>
                  <h2 className="text-3xl font-bold text-red-800 mb-2">
                    Nem egészen...
                  </h2>
                  <p className="text-red-700 text-lg">
                    A másik packaging valójában jobban teljesített!
                  </p>
                </>
              )}
            </div>

            {/* Comparison */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className={`bg-white rounded-lg p-6 ${videoA.id === actualWinner.id ? 'ring-4 ring-green-500' : ''}`}>
                <div className="text-center">
                  {videoA.id === actualWinner.id && (
                    <div className="text-2xl mb-2">👑</div>
                  )}
                  <h3 className="font-bold text-lg mb-2">
                    {videoA.guest_name || videoA.title}
                  </h3>
                  <div className="text-3xl font-bold text-purple-600 mb-1">
                    {videoA.actual_views?.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">megtekintés</div>
                </div>
              </div>

              <div className={`bg-white rounded-lg p-6 ${videoB.id === actualWinner.id ? 'ring-4 ring-green-500' : ''}`}>
                <div className="text-center">
                  {videoB.id === actualWinner.id && (
                    <div className="text-2xl mb-2">👑</div>
                  )}
                  <h3 className="font-bold text-lg mb-2">
                    {videoB.guest_name || videoB.title}
                  </h3>
                  <div className="text-3xl font-bold text-purple-600 mb-1">
                    {videoB.actual_views?.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">megtekintés</div>
                </div>
              </div>
            </div>

            {/* Difference */}
            <div className="text-center text-gray-700">
              <p>
                <strong>Különbség:</strong>{' '}
                {Math.abs(videoA.actual_views! - videoB.actual_views!).toLocaleString()} megtekintés
                ({Math.round(Math.abs(videoA.actual_views! - videoB.actual_views!) / Math.max(videoA.actual_views!, videoB.actual_views!) * 100)}%)
              </p>
            </div>

            {/* Next Button */}
            <div className="text-center mt-6">
              <button
                onClick={handleNext}
                className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition text-lg font-semibold"
              >
                Következő Párosítás →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="max-w-2xl mx-auto mt-12 text-center text-gray-600 text-sm">
        <p>
          A gyakorló módban valós Bazu epizódokat hasonlítasz össze.
          Ez segít kalibrálni az intuíciódat, hogy milyen packaging teljesít jól a csatornádon.
        </p>
      </div>
    </div>
  );
}
