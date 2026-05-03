'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/AuthContext';
import {
  getUserSessions,
  cancelSession,
  rateSession,
  type TherapySession,
} from '../../../lib/api';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  scheduled: { label: 'Scheduled', color: 'bg-sky-100 text-sky-700', icon: '📅' },
  completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700', icon: '✅' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: '❌' },
  'no-show': { label: 'No Show', color: 'bg-gray-100 text-gray-700', icon: '⚠️' },
};

function formatDateTime(d: string) {
  return new Date(d).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

interface RatingModalProps {
  sessionId: string;
  onClose: () => void;
  onSubmit: (sessionId: string, rating: number, feedback: string) => void;
}

function RatingModal({ sessionId, onClose, onSubmit }: RatingModalProps) {
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    await onSubmit(sessionId, rating, feedback);
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl">
        <h3 className="text-xl font-black mb-4">Rate Your Session</h3>
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button key={star} onClick={() => setRating(star)} className="text-3xl transition">
              {star <= rating ? '⭐' : '☆'}
            </button>
          ))}
        </div>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Share your experience (optional)..."
          rows={3}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 resize-none mb-6"
        />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold hover:bg-slate-50 transition">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition"
          >
            {submitting ? 'Submitting...' : 'Submit Rating'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TherapySessionsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [sessions, setSessions] = useState<TherapySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [ratingSession, setRatingSession] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    loadSessions();
  }, [user, filter]);

  async function loadSessions() {
    setLoading(true);
    try {
      const res = await getUserSessions(filter || undefined);
      setSessions(res.sessions || []);
    } catch {
      setError('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(sessionId: string) {
    if (!confirm('Cancel this session?')) return;
    setCancelling(sessionId);
    try {
      await cancelSession(sessionId);
      setSuccess('Session cancelled');
      loadSessions();
    } catch {
      setError('Failed to cancel session');
    } finally {
      setCancelling(null);
    }
  }

  async function handleRate(sessionId: string, rating: number, feedback: string) {
    try {
      await rateSession(sessionId, rating, feedback);
      setSuccess('Rating submitted — thank you!');
      setRatingSession(null);
      loadSessions();
    } catch {
      setError('Failed to submit rating');
    }
  }

  const upcoming = sessions.filter((s) => s.status === 'scheduled');
  const past = sessions.filter((s) => s.status !== 'scheduled');

  if (authLoading || !user) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/15 backdrop-blur-[2px]">
        <div className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-lg">Checking authentication...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.15),_transparent_35%),linear-gradient(180deg,#f8fbff_0%,#ffffff_55%,#f8fafc_100%)] text-slate-900">
      {ratingSession && (
        <RatingModal
          sessionId={ratingSession}
          onClose={() => setRatingSession(null)}
          onSubmit={handleRate}
        />
      )}

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link href="/therapy" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">← Back to Therapy</Link>
            <h1 className="mt-4 text-4xl font-black tracking-tight">📅 My Sessions</h1>
            <p className="mt-2 text-slate-600">Manage your therapy appointments</p>
          </div>
          <Link
            href="/therapy"
            className="self-start rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition"
          >
            Book New Session
          </Link>
        </header>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex justify-between">
            {error}
            <button onClick={() => setError(null)} className="underline ml-2">Dismiss</button>
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex justify-between">
            {success}
            <button onClick={() => setSuccess(null)} className="underline ml-2">Dismiss</button>
          </div>
        )}

        {loading ? (
          <div className="grid place-items-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-400 border-t-transparent" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="rounded-[2rem] bg-white border border-slate-100 p-12 text-center shadow-lg">
            <div className="text-5xl mb-4">📅</div>
            <h3 className="text-xl font-bold">No sessions yet</h3>
            <p className="mt-2 text-slate-500">Book a therapy session to get started.</p>
            <Link href="/therapy" className="mt-6 inline-block rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition">
              Browse Therapists
            </Link>
          </div>
        ) : (
          <>
            {/* Upcoming sessions */}
            {upcoming.length > 0 && (
              <section className="mb-10">
                <h2 className="text-2xl font-black mb-4">Upcoming Sessions</h2>
                <div className="space-y-4">
                  {upcoming.map((session) => (
                    <SessionCard
                      key={session._id}
                      session={session}
                      onCancel={() => handleCancel(session._id)}
                      onRate={() => setRatingSession(session._id)}
                      cancelling={cancelling === session._id}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Past sessions */}
            {past.length > 0 && (
              <section>
                <h2 className="text-2xl font-black mb-4">Past Sessions</h2>
                <div className="space-y-4">
                  {past.map((session) => (
                    <SessionCard
                      key={session._id}
                      session={session}
                      onCancel={() => handleCancel(session._id)}
                      onRate={() => setRatingSession(session._id)}
                      cancelling={false}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function SessionCard({
  session,
  onCancel,
  onRate,
  cancelling,
}: {
  session: TherapySession;
  onCancel: () => void;
  onRate: () => void;
  cancelling: boolean;
}) {
  const cfg = STATUS_CONFIG[session.status] || STATUS_CONFIG.scheduled;
  const therapist = session.therapistId;
  const therapistName = therapist?.userId?.fullName || 'Your Therapist';
  const specs = therapist?.specialization || [];

  return (
    <div className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${cfg.color}`}>
              {cfg.icon} {cfg.label}
            </span>
            {session.paymentStatus && (
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                session.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {session.paymentStatus}
              </span>
            )}
          </div>

          <h3 className="text-xl font-bold">{therapistName}</h3>
          {specs.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {specs.slice(0, 3).map((s: string) => (
                <span key={s} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{s}</span>
              ))}
            </div>
          )}

          <p className="text-sm text-slate-600 mt-3">
            🗓 {formatDateTime(session.scheduledAt)} · {session.durationMinutes} min
          </p>

          {session.meetingLink && session.status === 'scheduled' && (
            <a
              href={session.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-sky-600 hover:text-sky-700"
            >
              🔗 Join Meeting
            </a>
          )}

          {session.status === 'completed' && session.rating && (
            <p className="text-sm text-slate-500 mt-2">Your rating: {'⭐'.repeat(session.rating)}</p>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          {session.status === 'scheduled' && (
            <button
              onClick={onCancel}
              disabled={cancelling}
              className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition disabled:opacity-50"
            >
              {cancelling ? 'Cancelling...' : 'Cancel'}
            </button>
          )}
          {session.status === 'completed' && !session.rating && (
            <button
              onClick={onRate}
              className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition"
            >
              Rate Session
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
