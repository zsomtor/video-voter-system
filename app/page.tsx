'use client';

import { useState, useEffect } from 'react';
import { Video } from '@/lib/db';

export default function VotingPage() {
  const [videoA, setVideoA] = useState<Video | null>(null);
  const [videoB, setVideoB] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [totalVotes, setTotalVotes] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Fetch a new pair of videos
  const fetchNewPair = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/pair');
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Sikertelen videó betöltés');
        return;
      }

      setVideoA(data.videoA);
      setVideoB(data.videoB);
    } catch (err) {
      setError('Hálózati hiba. Kérlek próbáld újra.');
      console.error('Error fetching pair:', err);
    } finally {
      setLoading(false);
    }
  };

  // Record a vote
  const handleVote = async (winnerId: number, loserId: number) => {
    setVoting(true);

    try {
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winnerId, loserId }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Sikertelen szavazás');
        return;
      }

      // Increment vote counter
      setTotalVotes(prev => prev + 1);

      // Fetch next pair
      await fetchNewPair();
    } catch (err) {
      setError('Hálózati hiba. Kérlek próbáld újra.');
      console.error('Error recording vote:', err);
    } finally {
      setVoting(false);
    }
  };

  // Load initial pair on mount
  useEffect(() => {
    fetchNewPair();
  }, []);

  if (loading && !videoA) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Betöltés...</p>
        </div>
      </div>
    );
  }

  if (error && !videoA) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
          <p className="text-gray-600 mb-4">
            Győződj meg róla, hogy az adatbázis inicializálva van és vannak videók.
          </p>
          <a
            href="/admin"
            className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition"
          >
            Admin Irányítópult
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8 px-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="text-center mb-4">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Bazu Podcast - Videó Szavazó
          </h1>
          <p className="text-gray-600 text-lg">
            Melyik videóra kattintanál inkább?
          </p>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
          <div className="bg-white px-4 py-2 rounded-full shadow">
            <span className="font-semibold text-purple-600">{totalVotes}</span> leadott szavazat
          </div>
          <a
            href="/practice"
            className="bg-white px-4 py-2 rounded-full shadow hover:shadow-md transition"
          >
            📚 Gyakorló mód
          </a>
          <a
            href="/admin"
            className="bg-white px-4 py-2 rounded-full shadow hover:shadow-md transition"
          >
            📊 Rangsor megtekintése
          </a>
        </div>
      </div>

      {/* Voting Interface */}
      {videoA && videoB && (
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Video A */}
            <button
              onClick={() => handleVote(videoA.id, videoB.id)}
              disabled={voting}
              className="group relative bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed p-8"
            >
              <div className="absolute top-4 left-4 bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                A
              </div>

              <div className="mt-8 mb-6">
                {/* Guest Name */}
                {videoA.guest_name && (
                  <div className="text-center mb-4">
                    <span className="inline-block bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-semibold">
                      🎙️ {videoA.guest_name}
                    </span>
                  </div>
                )}

                {/* Thumbnail Simulation */}
                <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg p-12 mb-4">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🎬</div>
                    <div className="text-2xl font-bold text-gray-800">
                      {videoA.thumbnail_text}
                    </div>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
                  {videoA.title}
                </h3>

                {/* Metadata */}
                <div className="text-sm text-gray-500 text-center">
                  {videoA.actual_views && (
                    <span className="inline-block bg-gray-100 px-3 py-1 rounded-full mr-2">
                      {videoA.actual_views.toLocaleString()} megtekintés
                    </span>
                  )}
                  {videoA.source_type === 'test' && (
                    <span className="inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
                      Teszt
                    </span>
                  )}
                  {videoA.source_type === 'competitor' && (
                    <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                      Versenytárs
                    </span>
                  )}
                </div>
              </div>

              <div className="text-purple-600 font-semibold group-hover:text-purple-700">
                Kattints az A-ra szavazáshoz
              </div>
            </button>

            {/* Video B */}
            <button
              onClick={() => handleVote(videoB.id, videoA.id)}
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

                {/* Thumbnail Simulation */}
                <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg p-12 mb-4">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🎬</div>
                    <div className="text-2xl font-bold text-gray-800">
                      {videoB.thumbnail_text}
                    </div>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
                  {videoB.title}
                </h3>

                {/* Metadata */}
                <div className="text-sm text-gray-500 text-center">
                  {videoB.actual_views && (
                    <span className="inline-block bg-gray-100 px-3 py-1 rounded-full mr-2">
                      {videoB.actual_views.toLocaleString()} megtekintés
                    </span>
                  )}
                  {videoB.source_type === 'test' && (
                    <span className="inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
                      Teszt
                    </span>
                  )}
                  {videoB.source_type === 'competitor' && (
                    <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                      Versenytárs
                    </span>
                  )}
                </div>
              </div>

              <div className="text-blue-600 font-semibold group-hover:text-blue-700">
                Kattints a B-re szavazáshoz
              </div>
            </button>
          </div>

          {/* Loading indicator during vote */}
          {voting && (
            <div className="text-center mt-6">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <p className="text-gray-600 mt-2">Szavazat rögzítése...</p>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="max-w-2xl mx-auto mt-12 text-center text-gray-600 text-sm">
        <p>
          Szavazz arra, hogy melyik videóra kattintanál inkább.
          A szavazataid segítenek megjósolni, hogy a különböző videó packagingek milyen teljesítményt nyújtanak.
        </p>
      </div>
    </div>
  );
}
