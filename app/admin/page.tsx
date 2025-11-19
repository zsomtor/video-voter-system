'use client';

import { useState, useEffect } from 'react';

interface RankedVideo {
  rank: number;
  id: number;
  title: string;
  thumbnail_text: string;
  actual_views: number | null;
  elo_rating: number;
  vote_count: number;
  is_test: boolean;
  is_competitor: boolean;
  estimatedViews: number;
  confidence: number;
  tier: string;
  tierColor: string;
  tierDescription: string;
}

interface RankingsData {
  totalVotes: number;
  totalVideos: number;
  rankings: RankedVideo[];
}

export default function AdminPage() {
  const [data, setData] = useState<RankingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    thumbnailText: '',
    actualViews: '',
    isTest: false,
    isCompetitor: false,
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch rankings
  const fetchRankings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/rankings');
      const rankingsData = await response.json();
      setData(rankingsData);
    } catch (error) {
      console.error('Error fetching rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add new video
  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          thumbnailText: formData.thumbnailText,
          actualViews: formData.actualViews ? parseInt(formData.actualViews) : null,
          isTest: formData.isTest,
          isCompetitor: formData.isCompetitor,
        }),
      });

      if (response.ok) {
        // Reset form
        setFormData({
          title: '',
          thumbnailText: '',
          actualViews: '',
          isTest: false,
          isCompetitor: false,
        });
        setShowAddForm(false);
        // Refresh rankings
        await fetchRankings();
      } else {
        alert('Failed to add video');
      }
    } catch (error) {
      console.error('Error adding video:', error);
      alert('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchRankings();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading rankings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8 px-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-600">
              View rankings and manage videos
            </p>
          </div>
          <a
            href="/"
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition"
          >
            Back to Voting
          </a>
        </div>

        {/* Stats */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600">Total Videos</div>
              <div className="text-3xl font-bold text-purple-600">
                {data.totalVideos}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600">Total Votes</div>
              <div className="text-3xl font-bold text-blue-600">
                {data.totalVotes}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600">Avg Votes per Video</div>
              <div className="text-3xl font-bold text-green-600">
                {data.totalVideos > 0
                  ? Math.round((data.totalVotes * 2) / data.totalVideos)
                  : 0}
              </div>
            </div>
          </div>
        )}

        {/* Add Video Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
          >
            {showAddForm ? 'Cancel' : '+ Add New Video'}
          </button>
        </div>

        {/* Add Video Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Add New Video</h2>
            <form onSubmit={handleAddVideo} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Video Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  placeholder="How to Build a YouTube Algorithm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thumbnail Text
                </label>
                <input
                  type="text"
                  required
                  value={formData.thumbnailText}
                  onChange={(e) => setFormData({ ...formData, thumbnailText: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  placeholder="SECRET ALGORITHM REVEALED"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Actual Views (optional - helps calibrate predictions)
                </label>
                <input
                  type="number"
                  value={formData.actualViews}
                  onChange={(e) => setFormData({ ...formData, actualViews: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  placeholder="100000"
                />
              </div>

              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isTest}
                    onChange={(e) => setFormData({ ...formData, isTest: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">This is a test video</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isCompetitor}
                    onChange={(e) => setFormData({ ...formData, isCompetitor: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">This is a competitor video</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
              >
                {submitting ? 'Adding...' : 'Add Video'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Rankings Table */}
      {data && data.rankings.length > 0 && (
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Video
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ELO Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Votes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Confidence
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actual Views
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estimated Views
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.rankings.map((video) => (
                    <tr key={video.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-lg font-bold text-gray-900">
                          #{video.rank}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 mb-1">
                          {video.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {video.thumbnail_text}
                        </div>
                        <div className="flex gap-2 mt-1">
                          {video.is_test && (
                            <span className="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                              Test
                            </span>
                          )}
                          {video.is_competitor && (
                            <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                              Competitor
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-lg font-semibold text-purple-600">
                          {video.elo_rating}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`font-semibold ${video.tierColor}`}>
                          {video.tier}
                        </div>
                        <div className="text-xs text-gray-500">
                          {video.tierDescription}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-900">{video.vote_count}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${video.confidence * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">
                            {Math.round(video.confidence * 100)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {video.actual_views ? (
                          <div className="text-gray-900 font-medium">
                            {video.actual_views.toLocaleString()}
                          </div>
                        ) : (
                          <div className="text-gray-400">-</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-900 font-medium">
                          {video.estimatedViews.toLocaleString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* No videos message */}
      {data && data.rankings.length === 0 && (
        <div className="max-w-7xl mx-auto text-center">
          <div className="bg-white rounded-lg shadow-lg p-12">
            <p className="text-gray-600 text-lg mb-4">
              No videos yet. Add some videos to get started!
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition"
            >
              Add Your First Video
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
