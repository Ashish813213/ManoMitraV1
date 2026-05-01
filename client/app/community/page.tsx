'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { fetchCommunities, joinCommunity, leaveCommunity, type DashboardCommunity } from '../../lib/api';

const categories = ['anxiety_support', 'depression_support', 'stress_management', 'sleep_wellness', 'mindfulness', 'general'];

export default function CommunityPage() {
  const { user } = useAuth();
  const [communities, setCommunities] = useState<DashboardCommunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');

  useEffect(() => {
    loadCommunities();
  }, [selectedCat]);

  async function loadCommunities() {
    setLoading(true);
    try {
      const res = await fetchCommunities();
      if (res.communities) setCommunities(res.communities);
    } catch {}
    setLoading(false);
  }

  async function handleJoin(id: string) {
    try {
      await joinCommunity(id);
      setCommunities(prev =>
        prev.map(c =>
          c._id === id
            ? { ...c, totalMembers: (c.totalMembers || 0) + 1 }
            : c
        )
      );
    } catch {}
  }

  const filtered = communities.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.description?.toLowerCase().includes(search.toLowerCase()) ||
    (selectedCat ? c.category === selectedCat : true)
  );

  function formatCategory(cat: string) {
    return cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.15),_transparent_35%),linear-gradient(180deg,#f8fbff_0%,#ffffff_55%,#f8fafc_100%)] text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-10">
          <Link href="/dashboard" className="text-sm font-semibold text-amber-700 hover:text-amber-800">← Back to Dashboard</Link>
          <h1 className="mt-4 text-4xl font-black tracking-tight">👥 Join Community</h1>
          <p className="mt-2 text-slate-600">Find support spaces that match your needs</p>
        </header>

        <div className="mb-8 flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Search communities..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm focus:border-amber-400 focus:outline-none min-w-[200px]"
          />
          <select
            value={selectedCat}
            onChange={e => setSelectedCat(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm focus:border-amber-400 focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{formatCategory(c)}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading communities...</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((community) => (
              <div key={community._id} className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                <div className="mb-4 flex items-start justify-between">
                  <h3 className="text-xl font-bold">{community.name}</h3>
                  <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white">
                    {community.totalMembers || 0} members
                  </span>
                </div>
                <p className="text-sm text-slate-600 mb-4">{community.description}</p>
                <div className="mb-4">
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                    {formatCategory(community.category || 'general')}
                  </span>
                </div>
                <button
                  onClick={() => handleJoin(community._id)}
                  className="w-full rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-600"
                >
                  Join Community
                </button>
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500">No communities found matching your criteria.</p>
          </div>
        )}
      </div>
    </main>
  );
}
