'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { fetchResources, markRecommendationAsCompleted, type DashboardResource } from '../../lib/api';

export default function ResourcesPage() {
  const { user } = useAuth();
  const [resources, setResources] = useState<DashboardResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');

  const types = ['article', 'audio_guide', 'workshop', 'video', 'meditation', 'exercise'];

  useEffect(() => {
    loadResources();
  }, [selectedType]);

  async function loadResources() {
    setLoading(true);
    try {
      const res = await fetchResources();
      if (res.resources) setResources(res.resources);
    } catch {}
    setLoading(false);
  }

  function getResourceIcon(type?: string) {
    switch (type) {
      case 'audio_guide': return '🎧';
      case 'meditation': return '🧘';
      case 'workshop': return '🎓';
      case 'video': return '▶️';
      case 'exercise': return '💪';
      default: return '📚';
    }
  }

  function getResourceLabel(type?: string) {
    switch (type) {
      case 'audio_guide': return 'Audio Guide';
      case 'meditation': return 'Meditation';
      case 'workshop': return 'Workshop';
      case 'video': return 'Video';
      case 'exercise': return 'Exercise';
      default: return 'Article';
    }
  }

  const filtered = resources.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.description?.toLowerCase().includes(search.toLowerCase())
  ).filter(r => selectedType ? r.type === selectedType : true);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.15),_transparent_35%),linear-gradient(180deg,#f8fbff_0%,#ffffff_55%,#f8fafc_100%)] text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-10">
          <Link href="/dashboard" className="text-sm font-semibold text-sky-700 hover:text-sky-800">← Back to Dashboard</Link>
          <h1 className="mt-4 text-4xl font-black tracking-tight">📚 Wellness Resources</h1>
          <p className="mt-2 text-slate-600">Curated content for your mental wellness journey</p>
        </header>

        <div className="mb-8 flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Search resources..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm focus:border-sky-400 focus:outline-none min-w-[200px]"
          />
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm focus:border-sky-400 focus:outline-none"
          >
            <option value="">All Types</option>
            {types.map(t => (
              <option key={t} value={t}>{getResourceLabel(t)}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading resources...</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((resource) => (
              <Link key={resource._id} href={`/resources/${resource._id}`} className="block rounded-[2rem] border border-white/80 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)] hover:-translate-y-1 transition">
                <div className="mb-4 flex items-center justify-between">
                  <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700 uppercase tracking-wide">
                    {getResourceLabel(resource.type)}
                  </span>
                  <span className="text-3xl">{getResourceIcon(resource.type)}</span>
                </div>
                <h3 className="text-xl font-bold">{resource.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{resource.description}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                  <span>{resource.duration ? `${resource.duration} min` : 'Flexible'}</span>
                  <span>{resource.rating ? `★ ${resource.rating.toFixed(1)}` : 'Curated'}</span>
                </div>
                <span className="mt-4 inline-block w-full rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white text-center transition hover:bg-sky-700">
                  View Resource
                </span>
              </Link>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500">No resources found matching your criteria.</p>
          </div>
        )}
      </div>
    </main>
  );
}
