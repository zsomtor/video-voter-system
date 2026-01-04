'use client';

import { useState, useEffect } from 'react';

interface RankedIdea {
  rank: number;
  id: number;
  title: string;
  thumbnail_text: string;
  description: string | null;
  elo_rating: number;
  vote_count: number;
  created_at: Date;
}

export default function IdeaAdminPage() {
  const [ideas, setIdeas] = useState<RankedIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingIdea, setEditingIdea] = useState<RankedIdea | null>(null);
  const [totalVotes, setTotalVotes] = useState(0);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    thumbnailText: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const fetchIdeas = async () => {
    console.log('fetchIdeas called');
    setLoading(true);
    try {
      const response = await fetch('/api/idea-rankings', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      console.log('Rankings response status:', response.status);
      const data = await response.json();
      console.log('Rankings data:', data);
      setIdeas(data.ideas);
      setTotalVotes(data.totalVotes);
      console.log('State updated, ideas count:', data.ideas.length);
    } catch (error) {
      console.error('Error fetching ideas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdeas();
  }, []);

  const handleAddIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleAddIdea called', formData);
    setSubmitting(true);

    try {
      console.log('Sending request to /api/ideas');
      const response = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          thumbnailText: formData.thumbnailText,
          description: formData.description || null,
        }),
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Success:', result);
        setFormData({ title: '', thumbnailText: '', description: '' });
        setShowAddForm(false);
        await fetchIdeas();
      } else {
        const errorData = await response.json();
        console.error('Server error:', errorData);
        alert(`Hiba történt az ötlet hozzáadásakor: ${errorData.error || 'Ismeretlen hiba'}`);
      }
    } catch (error) {
      console.error('Error adding idea:', error);
      alert('Hiba történt az ötlet hozzáadásakor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIdea) return;

    setSubmitting(true);

    try {
      const response = await fetch(`/api/ideas/${editingIdea.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          thumbnailText: formData.thumbnailText,
          description: formData.description || null,
        }),
      });

      if (response.ok) {
        setEditingIdea(null);
        setFormData({ title: '', thumbnailText: '', description: '' });
        await fetchIdeas();
      } else {
        alert('Hiba történt az ötlet frissítésekor');
      }
    } catch (error) {
      console.error('Error updating idea:', error);
      alert('Hiba történt az ötlet frissítésekor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Biztosan törlöd ezt az ötletet?')) return;

    setDeleting(id);
    try {
      const response = await fetch(`/api/ideas/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchIdeas();
      } else {
        const errorData = await response.json();
        console.error('Delete error:', errorData);
        alert(`Hiba történt az ötlet törlésekor: ${errorData.error || 'Ismeretlen hiba'}`);
      }
    } catch (error) {
      console.error('Error deleting idea:', error);
      alert('Hiba történt az ötlet törlésekor');
    } finally {
      setDeleting(null);
    }
  };

  const startEdit = (idea: RankedIdea) => {
    setEditingIdea(idea);
    setFormData({
      title: idea.title,
      thumbnailText: idea.thumbnail_text,
      description: idea.description || '',
    });
    setShowAddForm(false);
  };

  const cancelEdit = () => {
    setEditingIdea(null);
    setFormData({ title: '', thumbnailText: '', description: '' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 flex items-center justify-center">
        <div className="text-2xl text-gray-600">Betöltés...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 py-8 px-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            💡 Videó Ötletek Admin
          </h1>
          <p className="text-gray-600 mb-4">
            Kezeld a videó ötleteidet és nézd meg melyeket érdemes leforgatni
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-sm text-gray-600">Összes Ötlet</div>
              <div className="text-3xl font-bold text-green-600">
                {ideas.length}
              </div>
            </div>
            <div className="bg-teal-50 rounded-lg p-4 text-center">
              <div className="text-sm text-gray-600">Összes Szavazat</div>
              <div className="text-3xl font-bold text-teal-600">
                {totalVotes}
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-sm text-gray-600">Átlag Szavazat/Ötlet</div>
              <div className="text-3xl font-bold text-blue-600">
                {ideas.length > 0 ? Math.round((totalVotes * 2) / ideas.length) : 0}
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setEditingIdea(null);
              setFormData({ title: '', thumbnailText: '', description: '' });
            }}
            className="mt-4 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
          >
            {showAddForm ? 'Bezárás' : '+ Új Ötlet Hozzáadása'}
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingIdea) && (
        <div className="max-w-3xl mx-auto mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {editingIdea ? '✏️ Ötlet Szerkesztése' : '➕ Új Ötlet Hozzáadása'}
            </h2>
            <form onSubmit={editingIdea ? handleUpdateIdea : handleAddIdea}>
              {/* Title */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  📹 Videó Címe *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  placeholder="Pl: Hogyan Építsünk Sikeres Podcastot?"
                />
              </div>

              {/* Thumbnail Text */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  📸 Thumbnail Szövege *
                </label>
                <input
                  type="text"
                  required
                  value={formData.thumbnailText}
                  onChange={(e) => setFormData({ ...formData, thumbnailText: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  placeholder="Pl: PODCAST TITKOK"
                />
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  📝 Leírás (opcionális)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  placeholder="Rövid leírás vagy koncepció..."
                  rows={3}
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  {submitting ? 'Mentés...' : editingIdea ? 'Módosítás' : 'Hozzáadás'}
                </button>
                {editingIdea && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                  >
                    Mégse
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ideas Table */}
      {ideas.length > 0 ? (
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rang</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ötlet</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ELO</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Szavazatok</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Műveletek</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ideas.map((idea) => (
                    <tr key={idea.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-lg font-bold text-gray-900">#{idea.rank}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-gray-900 mb-1">{idea.title}</div>
                          <div className="text-sm text-gray-600 mb-1">
                            📸 {idea.thumbnail_text}
                          </div>
                          {idea.description && (
                            <div className="text-xs text-gray-500 italic">
                              "{idea.description}"
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-lg font-semibold text-green-600">
                          {idea.elo_rating}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-900">{idea.vote_count}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(idea)}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition text-sm"
                          >
                            Szerkeszt
                          </button>
                          <button
                            onClick={() => handleDelete(idea.id)}
                            disabled={deleting === idea.id}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition text-sm disabled:opacity-50"
                          >
                            {deleting === idea.id ? 'Törlés...' : 'Törlés'}
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
      ) : (
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">💡</div>
            <p className="text-gray-600 text-lg mb-4">
              Még nincsenek ötletek. Add hozzá az első videó ötletedet!
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
            >
              Első Ötlet Hozzáadása
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
