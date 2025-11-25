'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { SourceType } from '@/lib/db';

interface RankedVideo {
  rank: number;
  id: number;
  title: string;
  thumbnail_text: string;
  thumbnail_url: string | null;
  actual_views: number | null;
  elo_rating: number;
  vote_count: number;
  source_type: SourceType;
  channel_name: string | null;
  guest_name: string | null;
  is_training_set: boolean;
  estimatedViews: number;
  confidence: number;
  tier: string;
  tierColor: string;
  tierDescription: string;
}

interface CalibrationInfo {
  isCalibrated: boolean;
  channelName: string | null;
  trainingDataCount: number;
  minViews: number;
  maxViews: number;
  confidence: number;
  status: string;
  message: string;
  color: string;
}

interface RankingsData {
  totalVotes: number;
  totalVideos: number;
  rankings: RankedVideo[];
  calibration: CalibrationInfo;
}

export default function AdminPage() {
  const [data, setData] = useState<RankingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState<RankedVideo | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    guestName: '',
    title: '',
    thumbnailText: '',
    thumbnailUrl: '',
    actualViews: '',
    sourceType: 'own' as SourceType,
    channelName: 'Bazu Podcast',
    isTrainingSet: true,
  });
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  // Helper function to convert YouTube URL to thumbnail URL
  const convertYouTubeUrlToThumbnail = (url: string): string => {
    // Extract video ID from various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,  // youtube.com/watch?v=VIDEO_ID
      /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,              // youtu.be/VIDEO_ID
      /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,    // youtube.com/embed/VIDEO_ID
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return `https://i.ytimg.com/vi/${match[1]}/maxresdefault.jpg`;
      }
    }

    // If no match, return original (might already be a thumbnail URL or invalid)
    return url;
  };

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
      let thumbnailUrl = formData.thumbnailUrl;

      // Upload file if provided
      if (thumbnailFile) {
        setUploading(true);
        const uploadFormData = new FormData();
        uploadFormData.append('file', thumbnailFile);

        const uploadResponse = await fetch('/api/upload-thumbnail', {
          method: 'POST',
          body: uploadFormData,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          thumbnailUrl = uploadData.url;
        } else {
          const errorData = await uploadResponse.json();
          alert(errorData.error || 'Sikertelen fájl feltöltés');
          setSubmitting(false);
          setUploading(false);
          return;
        }
        setUploading(false);
      }

      const response = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          thumbnailText: formData.thumbnailText,
          thumbnailUrl: thumbnailUrl || null,
          sourceType: formData.sourceType,
          actualViews: formData.actualViews ? parseInt(formData.actualViews) : null,
          channelName: formData.channelName || null,
          guestName: formData.guestName || null,
          isTrainingSet: formData.isTrainingSet,
        }),
      });

      if (response.ok) {
        // Reset form
        setFormData({
          guestName: '',
          title: '',
          thumbnailText: '',
          thumbnailUrl: '',
          actualViews: '',
          sourceType: 'own',
          channelName: 'Bazu Podcast',
          isTrainingSet: true,
        });
        setThumbnailFile(null);
        setShowAddForm(false);
        // Refresh rankings
        await fetchRankings();
      } else {
        alert('Sikertelen hozzáadás');
      }
    } catch (error) {
      console.error('Error adding video:', error);
      alert('Hálózati hiba');
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  // Delete video
  const handleDeleteVideo = async (videoId: number) => {
    if (!confirm('Biztosan törölni akarod ezt a videót?')) {
      return;
    }

    setDeleting(videoId);
    try {
      const response = await fetch(`/api/videos/${videoId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh rankings
        await fetchRankings();
        alert('Videó sikeresen törölve!');
      } else {
        const errorData = await response.json();
        alert(`Sikertelen törlés: ${errorData.error || 'Ismeretlen hiba'}\n${errorData.details || ''}`);
      }
    } catch (error) {
      console.error('Error deleting video:', error);
      alert('Hálózati hiba');
    } finally {
      setDeleting(null);
    }
  };

  // Edit video - open edit modal
  const handleEditClick = (video: RankedVideo) => {
    setEditingVideo(video);
    setFormData({
      title: video.title,
      thumbnailText: video.thumbnail_text,
      thumbnailUrl: video.thumbnail_url || '',
      actualViews: video.actual_views ? video.actual_views.toString() : '',
      sourceType: video.source_type,
      channelName: video.channel_name || 'Bazu Podcast',
      guestName: video.guest_name || '',
      isTrainingSet: video.is_training_set,
    });
    setShowAddForm(false);
  };

  // Update existing video
  const handleUpdateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVideo) return;

    setSubmitting(true);

    try {
      const response = await fetch(`/api/videos/${editingVideo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          thumbnailText: formData.thumbnailText,
          thumbnailUrl: formData.thumbnailUrl,
          actualViews: formData.actualViews ? parseInt(formData.actualViews) : null,
          sourceType: formData.sourceType,
          channelName: formData.channelName,
          guestName: formData.guestName,
          isTrainingSet: formData.isTrainingSet,
        }),
      });

      if (response.ok) {
        // Reset form and close edit modal
        setEditingVideo(null);
        setFormData({
          guestName: '',
          title: '',
          thumbnailText: '',
          thumbnailUrl: '',
          actualViews: '',
          sourceType: 'own',
          channelName: 'Bazu Podcast',
          isTrainingSet: true,
        });

        // Refresh rankings (this will recalibrate automatically)
        await fetchRankings();
        alert('Videó sikeresen frissítve! A becslések újrakalkulálódtak.');
      } else {
        const errorData = await response.json();
        alert(`Sikertelen frissítés: ${errorData.error || 'Ismeretlen hiba'}`);
      }
    } catch (error) {
      console.error('Error updating video:', error);
      alert('Hálózati hiba');
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
          <p className="mt-4 text-gray-600">Betöltés...</p>
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
              Admin Irányítópult
            </h1>
            <p className="text-gray-600">
              Rangsor megtekintése és videók kezelése
            </p>
          </div>
          <a
            href="/"
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition"
          >
            Vissza a szavazáshoz
          </a>
        </div>

        {/* Calibration Status */}
        {data && data.calibration && (
          <div className={`bg-white rounded-lg shadow p-6 mb-6 border-l-4 ${
            data.calibration.status === 'excellent' ? 'border-green-500' :
            data.calibration.status === 'good' ? 'border-blue-500' :
            data.calibration.status === 'needs_data' ? 'border-orange-500' :
            'border-red-500'
          }`}>
            <h3 className="font-bold text-lg mb-2">Kalibráció Állapota</h3>
            <p className={`${data.calibration.color} font-medium`}>
              {data.calibration.message}
            </p>
            {data.calibration.isCalibrated && (
              <div className="mt-2 text-sm text-gray-600">
                <p>Csatorna: <span className="font-semibold">{data.calibration.channelName}</span></p>
                <p>Nézettség tartomány: {data.calibration.minViews.toLocaleString()} - {data.calibration.maxViews.toLocaleString()}</p>
                <p>Megbízhatóság: {Math.round(data.calibration.confidence * 100)}%</p>
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600">Összes Videó</div>
              <div className="text-3xl font-bold text-purple-600">
                {data.totalVideos}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600">Összes Szavazat</div>
              <div className="text-3xl font-bold text-blue-600">
                {data.totalVotes}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600">Átlag Szavazat/Videó</div>
              <div className="text-3xl font-bold text-green-600">
                {data.totalVideos > 0
                  ? Math.round((data.totalVotes * 2) / data.totalVideos)
                  : 0}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600">Edzési Videók</div>
              <div className="text-3xl font-bold text-orange-600">
                {data.calibration?.trainingDataCount || 0}
              </div>
            </div>
          </div>
        )}

        {/* Add Video Button */}
        <div className="mb-6">
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setEditingVideo(null); // Close edit form when opening add form
            }}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
          >
            {showAddForm ? 'Mégse' : '+ Új Videó Hozzáadása'}
          </button>
        </div>

        {/* Edit Video Form */}
        {editingVideo && (
          <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-lg shadow-lg p-6 mb-6 border-2 border-blue-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-blue-900">Videó Szerkesztése</h2>
              <button
                onClick={() => {
                  setEditingVideo(null);
                  setFormData({
                    guestName: '',
                    title: '',
                    thumbnailText: '',
                    thumbnailUrl: '',
                    actualViews: '',
                    sourceType: 'own',
                    channelName: 'Bazu Podcast',
                    isTrainingSet: true,
                  });
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕ Bezárás
              </button>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800">
                💡 <strong>Tipp:</strong> Ha egy teszt packaging már ki lett rakva és van tényleges nézettségi adata,
                itt beállíthatod az <strong>Actual Views</strong>-t és bekapcsolhatod a <strong>Training Set</strong>-et.
                Így a rendszer tanul belőle és pontosabb becsléseket ad!
              </p>
            </div>
            <form onSubmit={handleUpdateVideo} className="space-y-4">
              {/* Source Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Típus *
                </label>
                <select
                  required
                  value={formData.sourceType}
                  onChange={(e) => {
                    const sourceType = e.target.value as SourceType;
                    setFormData({
                      ...formData,
                      sourceType,
                      isTrainingSet: sourceType === 'own', // Auto-set training for own videos
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                >
                  <option value="own">Saját (Bazu Podcast)</option>
                  <option value="competitor">Versenytárs</option>
                  <option value="test">Teszt (új packaging)</option>
                </select>
              </div>

              {/* Guest Name (for own videos) */}
              {formData.sourceType === 'own' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendég Neve *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.guestName}
                    onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder="Pl: Kapitány István"
                  />
                </div>
              )}

              {/* Channel Name (for competitors) */}
              {formData.sourceType === 'competitor' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Csatorna Neve
                  </label>
                  <input
                    type="text"
                    value={formData.channelName}
                    onChange={(e) => setFormData({ ...formData, channelName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder="Pl: Podcastboy"
                  />
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Videó Címe *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="Pl: Hogyan építs sikeres podcastot"
                />
              </div>

              {/* Thumbnail Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thumbnail Szöveg (Opcionális)
                </label>
                <input
                  type="text"
                  value={formData.thumbnailText}
                  onChange={(e) => setFormData({ ...formData, thumbnailText: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="Pl: PODCAST TITKOK"
                />
              </div>

              {/* Thumbnail URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  YouTube URL vagy Thumbnail URL (Opcionális)
                </label>
                <input
                  type="url"
                  value={formData.thumbnailUrl}
                  onChange={(e) => {
                    const inputUrl = e.target.value;
                    const thumbnailUrl = convertYouTubeUrlToThumbnail(inputUrl);
                    setFormData({ ...formData, thumbnailUrl });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="https://www.youtube.com/watch?v=VIDEO_ID"
                />
              </div>

              {/* Actual Views */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tényleges Nézettség {formData.sourceType !== 'test' && '*'}
                </label>
                <input
                  type="number"
                  required={formData.sourceType !== 'test'}
                  value={formData.actualViews}
                  onChange={(e) => {
                    const actualViews = e.target.value;
                    const newFormData = { ...formData, actualViews };

                    // Auto-convert test to own if training set is enabled and actual views are provided
                    if (formData.sourceType === 'test' && formData.isTrainingSet && actualViews) {
                      newFormData.sourceType = 'own';
                      newFormData.channelName = 'Bazu Podcast';
                    }

                    setFormData(newFormData);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="Pl: 85000"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.sourceType === 'test'
                    ? 'Ha a teszt packaging már ki lett rakva és van tényleges adat, add meg!'
                    : 'Add meg a videó tényleges nézettségét a kalibráció pontosságához'}
                </p>
              </div>

              {/* Training Set Checkbox */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isTrainingSet}
                    onChange={(e) => {
                      const isTrainingSet = e.target.checked;
                      const newFormData = { ...formData, isTrainingSet };

                      // Auto-convert test to own if training set is enabled and actual views are provided
                      if (formData.sourceType === 'test' && isTrainingSet && formData.actualViews) {
                        newFormData.sourceType = 'own';
                        newFormData.channelName = 'Bazu Podcast';
                      }

                      setFormData(newFormData);
                    }}
                    className="mr-2 w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">
                    Használd kalibrációhoz (training set)
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  Bekapcsolva: A rendszer tanul ebből a videóból (pontosabb becslések)
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {submitting ? 'Frissítés...' : '💾 Mentés'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingVideo(null);
                    setFormData({
                      guestName: '',
                      title: '',
                      thumbnailText: '',
                      thumbnailUrl: '',
                      actualViews: '',
                      sourceType: 'own',
                      channelName: 'Bazu Podcast',
                      isTrainingSet: true,
                    });
                  }}
                  className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition"
                >
                  Mégse
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Add Video Form */}
        {showAddForm && (
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg shadow-lg p-6 mb-6 border-2 border-purple-200">
            <h2 className="text-2xl font-bold mb-4 text-purple-900">Új Videó Hozzáadása</h2>
            <form onSubmit={handleAddVideo} className="space-y-4">
              {/* Source Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Típus *
                </label>
                <select
                  required
                  value={formData.sourceType}
                  onChange={(e) => {
                    const sourceType = e.target.value as SourceType;
                    setFormData({
                      ...formData,
                      sourceType,
                      isTrainingSet: sourceType === 'own', // Auto-set training for own videos
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                >
                  <option value="own">Saját (Bazu Podcast)</option>
                  <option value="competitor">Versenytárs</option>
                  <option value="test">Teszt (új packaging)</option>
                </select>
              </div>

              {/* Guest Name (for own videos) */}
              {formData.sourceType === 'own' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendég Neve *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.guestName}
                    onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    placeholder="Pl: Kapitány István"
                  />
                </div>
              )}

              {/* Channel Name (for competitors) */}
              {formData.sourceType === 'competitor' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Csatorna Neve
                  </label>
                  <input
                    type="text"
                    value={formData.channelName}
                    onChange={(e) => setFormData({ ...formData, channelName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    placeholder="Pl: Konkurens Podcast"
                  />
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Videó Címe *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  placeholder="Pl: Hogyan építs sikeres podcastot"
                />
              </div>

              {/* Thumbnail Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thumbnail Szöveg (Opcionális)
                </label>
                <input
                  type="text"
                  value={formData.thumbnailText}
                  onChange={(e) => setFormData({ ...formData, thumbnailText: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  placeholder="Pl: PODCAST TITKOK"
                />
                <p className="text-xs text-gray-500 mt-1">
                  A thumbnail-on megjelenő fő szöveg. Ha képet töltesz fel, ez opcionális.
                </p>
              </div>

              {/* Thumbnail URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  YouTube URL vagy Thumbnail URL (Opcionális)
                </label>
                <input
                  type="url"
                  value={formData.thumbnailUrl}
                  onChange={(e) => {
                    const inputUrl = e.target.value;
                    // Auto-convert YouTube URL to thumbnail URL
                    const thumbnailUrl = convertYouTubeUrlToThumbnail(inputUrl);
                    setFormData({ ...formData, thumbnailUrl });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  placeholder="https://www.youtube.com/watch?v=VIDEO_ID vagy https://i.ytimg.com/vi/VIDEO_ID/maxresdefault.jpg"
                  disabled={thumbnailFile !== null}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Beilleszthetsz YouTube videó linket (automatikusan átalakul thumbnail URL-re) vagy közvetlenül thumbnail URL-t.
                </p>
              </div>

              {/* Thumbnail File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thumbnail Feltöltés (Opcionális)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Validate file size (2MB)
                      if (file.size > 2 * 1024 * 1024) {
                        alert('A fájl mérete maximum 2MB lehet');
                        e.target.value = '';
                        return;
                      }
                      setThumbnailFile(file);
                    } else {
                      setThumbnailFile(null);
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tölts fel 1280x720px képet (max 2MB) új teszt packagingekhez. Formátum: JPG, PNG, WebP.
                </p>
                {thumbnailFile && (
                  <div className="mt-2 text-sm text-green-600">
                    ✓ Kiválasztva: {thumbnailFile.name} ({Math.round(thumbnailFile.size / 1024)}KB)
                  </div>
                )}
              </div>

              {/* Actual Views */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tényleges Nézettség {formData.sourceType !== 'test' && '*'}
                </label>
                <input
                  type="number"
                  required={formData.sourceType !== 'test'}
                  value={formData.actualViews}
                  onChange={(e) => setFormData({ ...formData, actualViews: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  placeholder="Pl: 85000"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.sourceType === 'test'
                    ? 'Hagyd üresen új teszt packagingnél'
                    : 'Add meg a videó tényleges nézettségét a kalibráció pontosságához'}
                </p>
              </div>

              {/* Training Set Checkbox */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isTrainingSet}
                    onChange={(e) => setFormData({ ...formData, isTrainingSet: e.target.checked })}
                    className="mr-2 w-4 h-4"
                    disabled={formData.sourceType === 'test'}
                  />
                  <span className="text-sm text-gray-700">
                    Használd kalibrációhoz (edzési adathalmaz)
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  Ajánlott minden saját videónál, ahol ismered a nézettséget
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || uploading}
                className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
              >
                {uploading ? 'Feltöltés...' : submitting ? 'Hozzáadás...' : 'Videó Hozzáadása'}
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
                      Rang
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Videó
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ELO
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Szint
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Szavazatok
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Megbízhatóság
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valós Nézettség
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Becsült Nézettség
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Műveletek
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
                        <div className="flex gap-3">
                          {/* Thumbnail Preview */}
                          {video.thumbnail_url ? (
                            <div className="relative w-24 h-14 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                              <Image
                                src={video.thumbnail_url}
                                alt={video.title}
                                fill
                                sizes="96px"
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-24 h-14 flex-shrink-0 rounded bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                              <span className="text-2xl">🎬</span>
                            </div>
                          )}

                          {/* Video Info */}
                          <div className="flex-1 min-w-0">
                            {video.guest_name && (
                              <div className="text-sm font-semibold text-purple-600 mb-1">
                                🎙️ {video.guest_name}
                              </div>
                            )}
                            <div className="font-medium text-gray-900 mb-1">
                              {video.title}
                            </div>
                            <div className="text-sm text-gray-500 truncate">
                              📸 {video.thumbnail_text}
                            </div>
                            <div className="flex gap-2 mt-1 flex-wrap">
                              {video.source_type === 'own' && (
                                <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                                  Saját
                                </span>
                              )}
                              {video.source_type === 'competitor' && (
                                <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                  Versenytárs
                                </span>
                              )}
                              {video.source_type === 'test' && (
                                <span className="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                                  Teszt
                                </span>
                              )}
                              {video.is_training_set && (
                                <span className="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                                  Edzési
                                </span>
                              )}
                            </div>
                          </div>
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
                        <div className="text-xs text-gray-500">
                          {video.vote_count < 30 && 'Kevés'}
                          {video.vote_count >= 30 && video.vote_count < 100 && 'Közepes'}
                          {video.vote_count >= 100 && 'Magas'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className={`h-2 rounded-full ${
                                video.confidence >= 0.8 ? 'bg-green-600' :
                                video.confidence >= 0.5 ? 'bg-yellow-600' :
                                'bg-red-600'
                              }`}
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
                        {video.actual_views && (
                          <div className="text-xs text-gray-500">
                            {Math.abs(video.estimatedViews - video.actual_views) / video.actual_views > 0.2
                              ? '⚠️ Nagy eltérés'
                              : '✓ Jó becslés'}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditClick(video)}
                            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition text-sm"
                          >
                            ✏️ Szerkeszt
                          </button>
                          <button
                            onClick={() => handleDeleteVideo(video.id)}
                            disabled={deleting === video.id}
                            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition disabled:opacity-50 text-sm"
                          >
                            {deleting === video.id ? 'Törlés...' : '🗑️'}
                          </button>
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

      {/* Test Video Insights */}
      {data && data.rankings.filter(v => v.source_type === 'test').length > 0 && (
        <div className="max-w-7xl mx-auto mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🧪 Teszt Videók Teljesítménye
          </h2>
          <div className="grid gap-4">
            {data.rankings
              .filter(v => v.source_type === 'test')
              .map((testVideo) => {
                // Find surrounding training videos
                const trainingVideos = data.rankings.filter(v => v.is_training_set && v.actual_views);
                const above = trainingVideos.filter(v => v.rank < testVideo.rank).slice(-1)[0];
                const below = trainingVideos.filter(v => v.rank > testVideo.rank)[0];

                return (
                  <div key={testVideo.id} className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-yellow-500">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          {testVideo.title}
                        </h3>
                        <p className="text-gray-600">
                          📸 {testVideo.thumbnail_text}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-purple-600">
                          #{testVideo.rank}
                        </div>
                        <div className="text-sm text-gray-500">
                          {data.rankings.length} videóból
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-purple-50 rounded-lg p-4 text-center">
                        <div className="text-sm text-gray-600 mb-1">ELO Értékelés</div>
                        <div className="text-2xl font-bold text-purple-600">
                          {testVideo.elo_rating}
                        </div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-4 text-center">
                        <div className="text-sm text-gray-600 mb-1">Becsült Nézettség</div>
                        <div className="text-2xl font-bold text-blue-600">
                          {testVideo.estimatedViews.toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4 text-center">
                        <div className="text-sm text-gray-600 mb-1">Megbízhatóság</div>
                        <div className="text-2xl font-bold text-green-600">
                          {Math.round(testVideo.confidence * 100)}%
                        </div>
                        {testVideo.vote_count < 50 && (
                          <div className="text-xs text-orange-600 mt-1">
                            Még {50 - testVideo.vote_count} szavazat kell
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Benchmark Comparison */}
                    {(above || below) && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-700 mb-3">
                          📊 Összehasonlítás a valós epizódokkal:
                        </h4>
                        <div className="space-y-2">
                          {above && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">
                                ⬆️ Jobb mint: <span className="font-semibold">{above.guest_name || above.title}</span>
                              </span>
                              <span className="text-green-600 font-semibold">
                                {above.actual_views?.toLocaleString()} nézés
                              </span>
                            </div>
                          )}
                          {below && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">
                                ⬇️ Gyengébb mint: <span className="font-semibold">{below.guest_name || below.title}</span>
                              </span>
                              <span className="text-red-600 font-semibold">
                                {below.actual_views?.toLocaleString()} nézés
                              </span>
                            </div>
                          )}
                        </div>

                        {data.calibration.isCalibrated && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-sm text-gray-600">
                              <strong>Becslés:</strong> Ez a packaging valószínűleg{' '}
                              <span className="text-purple-600 font-semibold">
                                {testVideo.estimatedViews.toLocaleString()}
                              </span>{' '}
                              megtekintést fog kapni
                              {above && below && (
                                <>
                                  {' '}({above.actual_views!.toLocaleString()} és {below.actual_views!.toLocaleString()} között)
                                </>
                              )}
                              .
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* No videos message */}
      {data && data.rankings.length === 0 && (
        <div className="max-w-7xl mx-auto text-center">
          <div className="bg-white rounded-lg shadow-lg p-12">
            <p className="text-gray-600 text-lg mb-4">
              Még nincsenek videók. Add hozzá a Bazu podcast epizódjaidat!
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition"
            >
              Első Videó Hozzáadása
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
