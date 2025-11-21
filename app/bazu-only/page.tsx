'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { Video } from '@/lib/db';

const MAX_VOTES = 15;

export default function BazuOnlyVotingPage() {
  const [videoA, setVideoA] = useState<Video | null>(null);
  const [videoB, setVideoB] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [totalVotes, setTotalVotes] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  // Fetch a new pair of Bazu-only videos
  const fetchNewPair = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/bazu-pair');
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
      const newVoteCount = totalVotes + 1;
      setTotalVotes(newVoteCount);

      // Save to localStorage
      localStorage.setItem('bazuOnlySessionCount', newVoteCount.toString());

      // Check if we've reached the limit
      if (newVoteCount >= MAX_VOTES) {
        setIsComplete(true);
      } else {
        // Fetch next pair
        await fetchNewPair();
      }
    } catch (err) {
      setError('Hálózati hiba. Kérlek próbáld újra.');
      console.error('Error recording vote:', err);
    } finally {
      setVoting(false);
    }
  };

  // Start a new round
  const handleNewRound = () => {
    setTotalVotes(0);
    setIsComplete(false);
    localStorage.setItem('bazuOnlySessionCount', '0');
    fetchNewPair();
  };

  // Load initial pair and session state on mount
  useEffect(() => {
    // Load session count from localStorage
    const savedCount = localStorage.getItem('bazuOnlySessionCount');
    if (savedCount) {
      const count = parseInt(savedCount, 10);
      setTotalVotes(count);
      if (count >= MAX_VOTES) {
        setIsComplete(true);
        setLoading(false);
        return;
      }
    }

    fetchNewPair();
  }, []);

  if (loading && !videoA) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Betöltés...</p>
        </div>
      </div>
    );
  }

  if (error && !videoA) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
          <p className="text-gray-600 mb-4">
            A Csak Bazu módhoz adj hozzá legalább 2 Bazu Podcast videót!
          </p>
        </div>
      </div>
    );
  }

  // Completion screen
  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center py-8 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-2xl p-12">
            <div className="text-7xl mb-6">🎉</div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Köszönjük!
            </h1>
            <p className="text-xl text-gray-700 mb-6">
              Leadtál <span className="font-bold text-blue-600">{MAX_VOTES} szavazatot</span> a Bazu belső rangsoron!
            </p>
            <p className="text-gray-600 mb-8">
              A szavazataid segítenek pontosabb Bazu belső rangsort építeni.
            </p>

            <div className="space-y-4">
              <button
                onClick={handleNewRound}
                className="w-full bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition text-lg font-semibold"
              >
                🔄 Új Kör Indítása
              </button>

              <a
                href="/"
                className="w-full bg-purple-100 text-purple-800 px-6 py-3 rounded-lg hover:bg-purple-200 transition font-semibold"
              >
                🌍 Vegyes Szavazás
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="text-center mb-4">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🎯 Csak Bazu - Belső Rangsor
          </h1>
          <p className="text-gray-600 text-lg">
            Melyik Bazu videóra kattintanál inkább?
          </p>
        </div>

        {/* Progress Bar */}
        <div className="max-w-md mx-auto mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Haladás</span>
            <span className="font-semibold text-blue-600">{totalVotes}/{MAX_VOTES}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${(totalVotes / MAX_VOTES) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center justify-center gap-4 text-sm text-gray-600 flex-wrap">
          <a
            href="/"
            className="bg-white px-4 py-2 rounded-full shadow hover:shadow-md transition"
          >
            🌍 Vegyes Szavazás
          </a>
          <a
            href="/practice"
            className="bg-white px-4 py-2 rounded-full shadow hover:shadow-md transition"
          >
            📚 Gyakorló mód
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
              <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                A
              </div>

              <div className="mt-8 mb-6">
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
                    <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg p-12">
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

              <div className="text-blue-600 font-semibold group-hover:text-blue-700">
                Kattints az A-ra szavazáshoz
              </div>
            </button>

            {/* Video B */}
            <button
              onClick={() => handleVote(videoB.id, videoA.id)}
              disabled={voting}
              className="group relative bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed p-8"
            >
              <div className="absolute top-4 left-4 bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                B
              </div>

              <div className="mt-8 mb-6">
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
                    <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg p-12">
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

              <div className="text-purple-600 font-semibold group-hover:text-purple-700">
                Kattints a B-re szavazáshoz
              </div>
            </button>
          </div>

          {/* Loading indicator during vote */}
          {voting && (
            <div className="text-center mt-6">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-600 mt-2">Szavazat rögzítése...</p>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="max-w-2xl mx-auto mt-12 text-center text-gray-600 text-sm">
        <p>
          Szavazz arra, hogy melyik Bazu videóra kattintanál inkább.
          Ezek a szavazatok építik a Bazu belső packaging rangsort.
        </p>
      </div>
    </div>
  );
}
