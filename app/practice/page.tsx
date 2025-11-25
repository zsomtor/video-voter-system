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
  const [correctVotes, setCorrectVotes] = useState(0);
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

    // Track correct answers
    if (selected.id === actualWin.id) {
      setCorrectVotes(prev => prev + 1);
    }

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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-8 px-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="text-center mb-6">
          <div className="inline-block bg-white rounded-full px-6 py-2 shadow-lg mb-4">
            <span className="text-2xl">📚</span>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-3">
            Gyakorló Mód
          </h1>
          <p className="text-gray-600 text-xl max-w-2xl mx-auto">
            Fejleszd a packaging intuíciódat valós Bazu epizódokkal!
          </p>
        </div>

        {/* Score Card */}
        <div className="max-w-2xl mx-auto mb-6">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <div className="text-sm text-gray-600 mb-1">Pontosság</div>
                <div className="text-4xl font-bold text-green-600">
                  {totalVotes > 0 ? Math.round((correctVotes / totalVotes) * 100) : 0}%
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {correctVotes} / {totalVotes} helyes
                </div>
              </div>
              <div className="w-px h-16 bg-gray-200"></div>
              <div className="text-center flex-1">
                <div className="text-sm text-gray-600 mb-1">Gyakorlás</div>
                <div className="text-4xl font-bold text-blue-600">
                  {totalVotes}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  összehasonlítás
                </div>
              </div>
              <div className="w-px h-16 bg-gray-200"></div>
              <div className="text-center flex-1">
                <a
                  href="/"
                  className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition font-semibold"
                >
                  🗳️ Éles Szavazás
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-gradient-to-r from-blue-50 to-teal-50 border-2 border-blue-200 rounded-xl p-5 text-center shadow-md">
            <div className="text-3xl mb-2">💡</div>
            <p className="text-blue-900 font-medium">
              Ezek valós Bazu epizódok. Találd ki melyik kapott több nézettséget, majd lásd a valós eredményt!
            </p>
          </div>
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
        <div className="max-w-5xl mx-auto">
          {/* Result Card */}
          <div className={`rounded-2xl shadow-2xl overflow-hidden mb-6 ${
            selectedWinner.id === actualWinner.id
              ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-4 border-green-400'
              : 'bg-gradient-to-br from-red-50 to-orange-50 border-4 border-red-400'
          }`}>
            {/* Result Header */}
            <div className={`p-6 text-center ${
              selectedWinner.id === actualWinner.id
                ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                : 'bg-gradient-to-r from-red-500 to-orange-500'
            }`}>
              {selectedWinner.id === actualWinner.id ? (
                <>
                  <div className="text-7xl mb-3">🎉</div>
                  <h2 className="text-4xl font-bold text-white mb-2">
                    Helyes Válasz!
                  </h2>
                  <p className="text-white text-xl">
                    Jó szemmel választottad ki a nyerő packagingot!
                  </p>
                </>
              ) : (
                <>
                  <div className="text-7xl mb-3">🤔</div>
                  <h2 className="text-4xl font-bold text-white mb-2">
                    Tévedés
                  </h2>
                  <p className="text-white text-xl">
                    A másik packaging teljesített jobban - tanulás!
                  </p>
                </>
              )}
            </div>

            {/* Comparison Cards */}
            <div className="p-8">
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className={`bg-white rounded-xl p-6 shadow-lg transition-all ${
                  videoA.id === actualWinner.id ? 'ring-4 ring-green-500 scale-105' : 'opacity-75'
                }`}>
                  <div className="text-center">
                    {videoA.id === actualWinner.id && (
                      <div className="text-4xl mb-3">👑</div>
                    )}
                    <h3 className="font-bold text-xl mb-3 text-gray-900">
                      {videoA.guest_name || videoA.title}
                    </h3>
                    <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-4 mb-2">
                      <div className="text-4xl font-bold text-purple-600 mb-1">
                        {videoA.actual_views?.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600 font-medium">megtekintés</div>
                    </div>
                    {videoA.id === selectedWinner.id && (
                      <div className="mt-2 text-sm text-blue-600 font-semibold">
                        ← Te ezt választottad
                      </div>
                    )}
                  </div>
                </div>

                <div className={`bg-white rounded-xl p-6 shadow-lg transition-all ${
                  videoB.id === actualWinner.id ? 'ring-4 ring-green-500 scale-105' : 'opacity-75'
                }`}>
                  <div className="text-center">
                    {videoB.id === actualWinner.id && (
                      <div className="text-4xl mb-3">👑</div>
                    )}
                    <h3 className="font-bold text-xl mb-3 text-gray-900">
                      {videoB.guest_name || videoB.title}
                    </h3>
                    <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-4 mb-2">
                      <div className="text-4xl font-bold text-purple-600 mb-1">
                        {videoB.actual_views?.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600 font-medium">megtekintés</div>
                    </div>
                    {videoB.id === selectedWinner.id && (
                      <div className="mt-2 text-sm text-blue-600 font-semibold">
                        ← Te ezt választottad
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="bg-white rounded-xl p-6 mb-6 shadow-lg">
                <div className="grid grid-cols-2 gap-6 text-center">
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Különbség</div>
                    <div className="text-3xl font-bold text-gray-900">
                      {Math.abs(videoA.actual_views! - videoB.actual_views!).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">megtekintés</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Százalékos különbség</div>
                    <div className="text-3xl font-bold text-gray-900">
                      {Math.round(Math.abs(videoA.actual_views! - videoB.actual_views!) / Math.max(videoA.actual_views!, videoB.actual_views!) * 100)}%
                    </div>
                    <div className="text-sm text-gray-500 mt-1">eltérés</div>
                  </div>
                </div>
              </div>

              {/* Next Button */}
              <div className="text-center">
                <button
                  onClick={handleNext}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-10 py-4 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all text-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Következő Párosítás →
                </button>
              </div>
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
