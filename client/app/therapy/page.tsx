'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { getTherapists, bookTherapist, type Therapist } from '../../lib/api';

export default function TherapyPage() {
  const { user } = useAuth();
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSpec, setSelectedSpec] = useState('');
  const [minRating, setMinRating] = useState('');
  const [booking, setBooking] = useState<string | null>(null);

  const specializations = ['anxiety', 'depression', 'trauma', 'stress', 'relationships', 'grief', 'addiction', 'ocd', 'sleep', 'other'];

  useEffect(() => {
    loadTherapists();
  }, [selectedSpec, minRating]);

  async function loadTherapists() {
    setLoading(true);
    try {
      const res = await getTherapists(
        selectedSpec || undefined,
        minRating ? parseFloat(minRating) : undefined,
        false
      );
      if (res.success) setTherapists(res.therapists);
    } catch {}
    setLoading(false);
  }

  async function handleBook(therapistId: string) {
    setBooking(therapistId);
    try {
      await bookTherapist(therapistId, new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString());
      alert('Therapy session booked successfully!');
    } catch {
      alert('Failed to book session. Please try again.');
    }
    setBooking(null);
  }

  const filtered = therapists.filter(t =>
    t.userId?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    t.specialization.some(s => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.15),_transparent_35%),linear-gradient(180deg,#f8fbff_0%,#ffffff_55%,#f8fafc_100%)] text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-10">
          <Link href="/dashboard" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">← Back to Dashboard</Link>
          <h1 className="mt-4 text-4xl font-black tracking-tight">📅 Schedule Therapy</h1>
          <p className="mt-2 text-slate-600">Browse verified therapists and book your session</p>
        </header>

        <div className="mb-8 flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Search therapists..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm focus:border-emerald-400 focus:outline-none min-w-[200px]"
          />
          <select
            value={selectedSpec}
            onChange={e => setSelectedSpec(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm focus:border-emerald-400 focus:outline-none"
          >
            <option value="">All Specializations</option>
            {specializations.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <select
            value={minRating}
            onChange={e => setMinRating(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm focus:border-emerald-400 focus:outline-none"
          >
            <option value="">Any Rating</option>
            <option value="4">4+ Stars</option>
            <option value="4.5">4.5+ Stars</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading therapists...</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((therapist) => (
              <div key={therapist._id} className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">{therapist.userId?.fullName || 'Therapist'}</h3>
                    {therapist.isVerified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 mt-1">
                        ✓ Verified
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-emerald-600">★ {therapist.rating?.toFixed(1) || 'N/A'}</div>
                    <div className="text-xs text-slate-500">{therapist.totalSessions} sessions</div>
                  </div>
                </div>

                <p className="text-sm text-slate-600 mb-4">{therapist.bio || therapist.qualifications}</p>

                <div className="mb-4 flex flex-wrap gap-2">
                  {therapist.specialization.map(s => (
                    <span key={s} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                      {s}
                    </span>
                  ))}
                </div>

                <div className="space-y-2 text-xs text-slate-600 mb-4">
                  <div className="flex justify-between">
                    <span>Experience</span>
                    <span className="font-semibold">{therapist.experienceYears} years</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hourly Rate</span>
                    <span className="font-semibold">${therapist.hourlyRate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Languages</span>
                    <span className="font-semibold">{therapist.languages?.join(', ') || 'English'}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleBook(therapist._id)}
                  disabled={booking === therapist._id}
                  className="w-full rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  {booking === therapist._id ? 'Booking...' : 'Book Session'}
                </button>
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500">No therapists found matching your criteria.</p>
          </div>
        )}
      </div>
    </main>
  );
}
