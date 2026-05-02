'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../lib/AuthContext';
import {
  logMood,
  fetchMoodHistory,
  type MoodEntry,
  type MoodLogResponse,
} from '../../lib/api';

const MOOD_OPTIONS = [
  { score: 1, label: 'Terrible', emoji: '😭', color: 'from-red-500 to-red-700', bg: 'bg-red-50', border: 'border-red-200' },
  { score: 2, label: 'Very Bad', emoji: '😢', color: 'from-red-400 to-orange-500', bg: 'bg-red-50', border: 'border-red-200' },
  { score: 3, label: 'Bad', emoji: '😞', color: 'from-orange-400 to-amber-500', bg: 'bg-orange-50', border: 'border-orange-200' },
  { score: 4, label: 'Low', emoji: '🙁', color: 'from-amber-400 to-yellow-500', bg: 'bg-amber-50', border: 'border-amber-200' },
  { score: 5, label: 'Okay', emoji: '😐', color: 'from-yellow-400 to-lime-500', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  { score: 6, label: 'Fine', emoji: '🙂', color: 'from-lime-400 to-green-500', bg: 'bg-lime-50', border: 'border-lime-200' },
  { score: 7, label: 'Good', emoji: '😊', color: 'from-green-400 to-emerald-500', bg: 'bg-green-50', border: 'border-green-200' },
  { score: 8, label: 'Great', emoji: '😄', color: 'from-emerald-400 to-teal-500', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  { score: 9, label: 'Amazing', emoji: '🤩', color: 'from-teal-400 to-cyan-500', bg: 'bg-teal-50', border: 'border-teal-200' },
  { score: 10, label: 'Perfect', emoji: '🌟', color: 'from-cyan-400 to-sky-500', bg: 'bg-cyan-50', border: 'border-cyan-200' },
];

const EMOTION_COLORS: Record<string, string> = {
  sad: 'bg-blue-100 text-blue-700',
  happy: 'bg-yellow-100 text-yellow-700',
  angry: 'bg-red-100 text-red-700',
  anxious: 'bg-purple-100 text-purple-700',
  calm: 'bg-green-100 text-green-700',
  neutral: 'bg-gray-100 text-gray-700',
  excited: 'bg-orange-100 text-orange-700',
  confused: 'bg-indigo-100 text-indigo-700',
  hopeful: 'bg-teal-100 text-teal-700',
};

const EMOTION_EMOJIS: Record<string, string> = {
  sad: '😢',
  happy: '😊',
  angry: '😠',
  anxious: '😰',
  calm: '😌',
  neutral: '😐',
  excited: '🤩',
  confused: '😕',
  hopeful: '🌟',
};

function getSentimentLabel(score: number): string {
  if (score > 0.3) return 'Positive';
  if (score < -0.3) return 'Negative';
  return 'Neutral';
}

function getSentimentColor(score: number): string {
  if (score > 0.3) return 'text-green-600';
  if (score < -0.3) return 'text-red-600';
  return 'text-gray-600';
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diff = Math.floor((now.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export default function MoodPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [selectedScore, setSelectedScore] = useState(5);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<MoodLogResponse | null>(null);
  const [history, setHistory] = useState<MoodEntry[]>([]);
  const [historyDays, setHistoryDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    loadHistory();
  }, [user, historyDays]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const res = await fetchMoodHistory(historyDays);
      setHistory(res.trend || []);
    } catch {
      setError('Failed to load mood history');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const data = await logMood(selectedScore, note.trim() || undefined);
      setResult(data);
      setShowResult(true);
      setNote('');
      loadHistory();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to log mood');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseResult = () => {
    setShowResult(false);
    setResult(null);
  };

  if (authLoading || !user) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/15 backdrop-blur-[2px]">
        <div className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-lg">
          Checking authentication...
        </div>
      </div>
    );
  }

  const selectedMood = MOOD_OPTIONS.find((m) => m.score === selectedScore);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_35%),linear-gradient(180deg,#f8fbff_0%,#ffffff_55%,#f8fafc_100%)] text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-10 overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-3 inline-flex rounded-full bg-sky-100 px-4 py-1 text-sm font-semibold text-sky-700">
                AI-powered mood tracking
              </p>
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
                Mood <span className="text-sky-700">Tracker</span>
              </h1>
              <p className="mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
                Log your mood, get AI insights, and track your emotional journey over time.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:border-sky-200 hover:text-sky-700"
            >
              Back to Dashboard
            </Link>
          </div>
        </header>

        {error && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">
            {error}
            <button onClick={() => setError(null)} className="ml-4 font-bold underline">Dismiss</button>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-2">
          <section className="rounded-[2rem] border border-white/80 bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
            <h2 className="mb-2 text-2xl font-black tracking-tight">How are you feeling?</h2>
            <p className="mb-6 text-sm text-slate-500">Select your mood score below</p>

            <div className="grid grid-cols-5 gap-3 mb-6">
              {MOOD_OPTIONS.map((mood) => (
                <button
                  key={mood.score}
                  onClick={() => setSelectedScore(mood.score)}
                  className={`flex flex-col items-center gap-1 rounded-2xl p-3 transition-all ${
                    selectedScore === mood.score
                      ? `bg-gradient-to-br ${mood.color} text-white scale-105 shadow-lg`
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-2xl">{mood.emoji}</span>
                  <span className="text-xs font-bold">{mood.score}</span>
                </button>
              ))}
            </div>

            {selectedMood && (
              <div className={`mb-6 rounded-2xl ${selectedMood.bg} border ${selectedMood.border} p-4 text-center`}>
                <span className="text-3xl">{selectedMood.emoji}</span>
                <p className="mt-1 text-sm font-semibold text-slate-700">
                  Score: {selectedMood.score}/10 &middot; {selectedMood.label}
                </p>
              </div>
            )}

            <div className="mb-6">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                What&apos;s on your mind? <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 resize-none"
                placeholder="Describe how you're feeling... AI will analyze your emotions and provide personalized insights..."
              />
              {note.length > 0 && (
                <p className="mt-2 text-xs text-slate-400">
                  AI will analyze sentiment, detect emotions, and check for safety concerns.
                </p>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full rounded-full bg-gradient-to-r from-sky-600 to-indigo-600 px-6 py-4 text-sm font-semibold text-white transition hover:from-sky-700 hover:to-indigo-700 disabled:opacity-60"
            >
              {submitting ? 'Analyzing your mood...' : 'Log Mood & Get AI Insights'}
            </button>

            {showResult && result && (
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl bg-gradient-to-br from-sky-50 to-indigo-50 border border-sky-100 p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-4xl">{MOOD_OPTIONS.find((m) => m.score === result.mood.score)?.emoji ?? '😐'}</span>
                    <div>
                      <p className="text-lg font-bold text-slate-900">Mood Logged Successfully!</p>
                      <p className="text-sm text-slate-600">Score: {result.mood.score}/10</p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-white/80 p-4">
                      <p className="text-xs font-semibold text-slate-500 mb-1">AI Detected Emotion</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{EMOTION_EMOJIS[result.mood.emotion] || '😐'}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${EMOTION_COLORS[result.mood.emotion] || EMOTION_COLORS.neutral}`}>
                          {result.mood.emotion}
                        </span>
                      </div>
                    </div>
                    <div className="rounded-xl bg-white/80 p-4">
                      <p className="text-xs font-semibold text-slate-500 mb-1">Sentiment Analysis</p>
                      <p className={`text-lg font-bold ${getSentimentColor(result.mood.sentimentScore)}`}>
                        {getSentimentLabel(result.mood.sentimentScore)}
                      </p>
                      <p className="text-xs text-slate-400">Score: {result.mood.sentimentScore.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {result.aiInsight && (
                  <div className="rounded-2xl bg-white border border-slate-100 p-5 shadow-sm">
                    <p className="text-sm font-semibold text-sky-700 mb-2">💡 AI Personalized Insight</p>
                    <p className="text-sm text-slate-700">{result.aiInsight}</p>
                  </div>
                )}

                {result.safetyAlert?.triggered && (
                  <div className="rounded-2xl bg-red-50 border border-red-200 p-5">
                    <p className="text-sm font-semibold text-red-700 mb-2">🚨 Safety Alert</p>
                    <p className="text-sm text-red-600 mb-3">
                      We noticed you may be in distress. Please reach out for support.
                    </p>
                    <p className="text-sm font-bold text-red-700">Crisis Hotline: 1-800-273-8255</p>
                  </div>
                )}

                <button
                  onClick={handleCloseResult}
                  className="w-full rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Done
                </button>
              </div>
            )}
          </section>

          <section className="rounded-[2rem] border border-white/80 bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tight">Mood History</h2>
                <p className="text-sm text-slate-500">Your recent emotional check-ins</p>
              </div>
              <select
                value={historyDays}
                onChange={(e) => setHistoryDays(parseInt(e.target.value))}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none"
              >
                <option value={7}>Last 7 days</option>
                <option value={14}>Last 14 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </div>

            {loading ? (
              <div className="grid place-items-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-400 border-t-transparent" />
              </div>
            ) : history.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-8 text-center">
                <div className="text-5xl mb-4">📅</div>
                <h3 className="text-lg font-bold text-slate-700">No mood entries yet</h3>
                <p className="mt-2 text-sm text-slate-500">Start logging your mood to see your history here.</p>
              </div>
            ) : (
              <>
                <div className="mb-6 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl bg-slate-50 p-4 text-center">
                    <p className="text-xs font-semibold text-slate-500">Entries</p>
                    <p className="text-2xl font-black text-slate-900">{history.length}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4 text-center">
                    <p className="text-xs font-semibold text-slate-500">Avg Mood</p>
                    <p className="text-2xl font-black text-slate-900">
                      {(history.reduce((a, b) => a + b.moodScore, 0) / history.length).toFixed(1)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4 text-center">
                    <p className="text-xs font-semibold text-slate-500">Trend</p>
                    <p className="text-2xl font-black">
                      {history.length >= 2 ? (
                        history[0].moodScore >= history[1].moodScore ? (
                          <span className="text-green-600">📈</span>
                        ) : (
                          <span className="text-red-600">📉</span>
                        )
                      ) : (
                        <span className="text-gray-600">-</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2">
                  {history.map((entry, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-100 bg-slate-50 p-4 transition hover:border-sky-200 hover:bg-sky-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {MOOD_OPTIONS.find((m) => m.score === entry.moodScore)?.emoji ?? '😐'}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {entry.moodScore}/10 &middot; {MOOD_OPTIONS.find((m) => m.score === entry.moodScore)?.label ?? ''}
                            </p>
                            <p className="text-xs text-slate-500">
                              {formatDate(entry.date)} at {formatTime(entry.date)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {entry.emotion && (
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${EMOTION_COLORS[entry.emotion] || EMOTION_COLORS.neutral}`}>
                              {EMOTION_EMOJIS[entry.emotion] || ''} {entry.emotion}
                            </span>
                          )}
                        </div>
                      </div>
                      {entry.note && (
                        <p className="mt-3 text-sm text-slate-600 line-clamp-2">&ldquo;{entry.note}&rdquo;</p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
