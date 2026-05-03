'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/AuthContext';
import { fetchMoodAnalytics, type MoodAnalytics } from '../../../lib/api';

const EMOTION_COLORS: Record<string, string> = {
  sad: '#3b82f6',
  happy: '#eab308',
  angry: '#ef4444',
  anxious: '#a855f7',
  calm: '#22c55e',
  neutral: '#6b7280',
  excited: '#f97316',
  confused: '#6366f1',
  hopeful: '#14b8a6',
};

const EMOTION_EMOJIS: Record<string, string> = {
  sad: '😢', happy: '😊', angry: '😠', anxious: '😰',
  calm: '😌', neutral: '😐', excited: '🤩', confused: '😕', hopeful: '🌟',
};

function MiniBarChart({ data }: { data: { date: string; averageScore: number }[] }) {
  if (!data.length) return <p className="text-slate-400 text-sm text-center py-8">No data yet</p>;
  const max = 10;
  return (
    <div className="flex items-end gap-1 h-32 overflow-x-auto pb-2">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-1 min-w-[20px]">
          <div
            className="w-5 rounded-t-sm transition-all"
            style={{
              height: `${(d.averageScore / max) * 100}%`,
              backgroundColor: d.averageScore >= 7 ? '#22c55e' : d.averageScore >= 5 ? '#eab308' : '#ef4444',
              minHeight: '4px',
            }}
            title={`${d.date}: ${d.averageScore.toFixed(1)}`}
          />
          {i % Math.ceil(data.length / 6) === 0 && (
            <span className="text-[9px] text-slate-400 rotate-45 origin-top-left">{d.date.slice(5)}</span>
          )}
        </div>
      ))}
    </div>
  );
}

function EmotionDonut({ dist }: { dist: Record<string, number> }) {
  const entries = Object.entries(dist).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  if (!total) return <p className="text-slate-400 text-sm text-center py-8">No data yet</p>;

  let cumulativePercent = 0;
  const slices = entries.map(([emotion, count]) => {
    const percent = (count / total) * 100;
    const start = cumulativePercent;
    cumulativePercent += percent;
    return { emotion, count, percent, start };
  });

  const radius = 60;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative w-36 h-36 flex-shrink-0">
        <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
          {slices.map(({ emotion, percent, start }) => (
            <circle
              key={emotion}
              cx="80" cy="80" r={radius}
              fill="none"
              stroke={EMOTION_COLORS[emotion] || '#94a3b8'}
              strokeWidth="24"
              strokeDasharray={`${(percent / 100) * circumference} ${circumference}`}
              strokeDashoffset={-((start / 100) * circumference)}
            />
          ))}
        </svg>
      </div>
      <div className="flex flex-wrap gap-2">
        {slices.map(({ emotion, count, percent }) => (
          <div key={emotion} className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: EMOTION_COLORS[emotion] || '#94a3b8' }} />
            <span>{EMOTION_EMOJIS[emotion] || ''} {emotion}</span>
            <span className="text-slate-400 text-xs">({count}, {percent.toFixed(0)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StreakHeatmap({ dailyTrend }: { dailyTrend: { date: string; averageScore: number; entryCount: number }[] }) {
  const today = new Date();
  const days = Array.from({ length: 35 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (34 - i));
    return d.toISOString().split('T')[0];
  });

  const entryMap: Record<string, number> = {};
  dailyTrend.forEach((d) => { entryMap[d.date] = d.averageScore; });

  return (
    <div>
      <div className="flex gap-1 flex-wrap">
        {days.map((date) => {
          const score = entryMap[date];
          let bg = 'bg-slate-100';
          if (score !== undefined) {
            if (score >= 7) bg = 'bg-green-400';
            else if (score >= 5) bg = 'bg-yellow-400';
            else bg = 'bg-red-400';
          }
          return (
            <div
              key={date}
              className={`w-6 h-6 rounded-sm ${bg} transition-all`}
              title={score !== undefined ? `${date}: ${score.toFixed(1)}` : `${date}: no entry`}
            />
          );
        })}
      </div>
      <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-slate-100 rounded-sm inline-block" /> No entry</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-400 rounded-sm inline-block" /> Low (1-4)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-400 rounded-sm inline-block" /> OK (5-6)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-400 rounded-sm inline-block" /> Good (7-10)</span>
      </div>
    </div>
  );
}

export default function MoodAnalyticsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [analytics, setAnalytics] = useState<MoodAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    loadAnalytics();
  }, [user, days]);

  async function loadAnalytics() {
    setLoading(true);
    try {
      const res = await fetchMoodAnalytics(days);
      if (res.success) setAnalytics(res.data);
    } catch {
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || !user) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/15 backdrop-blur-[2px]">
        <div className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-lg">Checking authentication...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_35%),linear-gradient(180deg,#f8fbff_0%,#ffffff_55%,#f8fafc_100%)] text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-10">
          <Link href="/mood" className="text-sm font-semibold text-sky-700 hover:text-sky-800">← Back to Mood Tracker</Link>
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black tracking-tight">📊 Mood Analytics</h1>
              <p className="mt-2 text-slate-600">Insights from your emotional journey</p>
            </div>
            <select
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-sky-400 focus:outline-none"
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
        </header>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error} <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
          </div>
        )}

        {loading ? (
          <div className="grid place-items-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-400 border-t-transparent" />
          </div>
        ) : !analytics || analytics.totalEntries === 0 ? (
          <div className="rounded-[2rem] bg-white border border-slate-100 p-12 text-center shadow-lg">
            <div className="text-5xl mb-4">📅</div>
            <h3 className="text-xl font-bold">No mood data yet</h3>
            <p className="mt-2 text-slate-500">Start logging your mood daily to see analytics here.</p>
            <Link href="/mood" className="mt-6 inline-block rounded-full bg-sky-600 px-6 py-3 text-sm font-semibold text-white hover:bg-sky-700 transition">
              Log Your First Mood
            </Link>
          </div>
        ) : (
          <>
            {/* Stats cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              {[
                { label: 'Total Entries', value: analytics.totalEntries, icon: '📝', color: 'text-sky-700' },
                { label: 'Average Mood', value: `${analytics.averageMoodScore}/10`, icon: '😊', color: 'text-emerald-700' },
                { label: 'This Week Avg', value: `${analytics.weeklyAverage}/10`, icon: '📈', color: 'text-violet-700' },
                { label: 'Current Streak', value: `${analytics.currentStreak} days`, icon: '🔥', color: 'text-orange-700' },
              ].map((s) => (
                <div key={s.label} className="rounded-[2rem] bg-white border border-white/80 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                  <div className="text-2xl mb-2">{s.icon}</div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{s.label}</p>
                  <p className={`text-3xl font-black mt-1 ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Best / Worst days */}
            <div className="grid gap-4 sm:grid-cols-2 mb-8">
              {[
                { label: '🏆 Best Day', day: analytics.bestDay, color: 'border-emerald-200 bg-emerald-50' },
                { label: '💔 Lowest Day', day: analytics.worstDay, color: 'border-red-200 bg-red-50' },
              ].map(({ label, day, color }) => (
                <div key={label} className={`rounded-[2rem] border p-6 ${color}`}>
                  <p className="text-sm font-bold text-slate-700">{label}</p>
                  {day ? (
                    <>
                      <p className="text-2xl font-black text-slate-900 mt-2">{day.score}/10</p>
                      <p className="text-sm text-slate-600 mt-1">{EMOTION_EMOJIS[day.emotion] || ''} {day.emotion} · {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    </>
                  ) : (
                    <p className="text-slate-500 text-sm mt-2">No data</p>
                  )}
                </div>
              ))}
            </div>

            {/* Mood trend chart */}
            <div className="rounded-[2rem] bg-white border border-white/80 p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)] mb-8">
              <h2 className="text-xl font-black mb-4">Mood Trend (Last {days} Days)</h2>
              <MiniBarChart data={analytics.dailyTrend} />
            </div>

            {/* Streak heatmap + Emotion distribution */}
            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              <div className="rounded-[2rem] bg-white border border-white/80 p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                <h2 className="text-xl font-black mb-4">Activity Heatmap</h2>
                <StreakHeatmap dailyTrend={analytics.dailyTrend} />
              </div>
              <div className="rounded-[2rem] bg-white border border-white/80 p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                <h2 className="text-xl font-black mb-4">Emotion Distribution</h2>
                <EmotionDonut dist={analytics.emotionDistribution} />
              </div>
            </div>

            {/* AI Insights */}
            {analytics.insights && analytics.insights.length > 0 && (
              <div className="rounded-[2rem] bg-white border border-white/80 p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                <h2 className="text-xl font-black mb-6">💡 Personalized Insights</h2>
                <div className="space-y-4">
                  {analytics.insights.map((insight, i) => (
                    <div key={i} className={`rounded-2xl p-5 border ${
                      insight.type === 'positive' ? 'bg-emerald-50 border-emerald-200' :
                      insight.type === 'concern' ? 'bg-amber-50 border-amber-200' :
                      'bg-sky-50 border-sky-200'
                    }`}>
                      <p className="text-sm text-slate-700">{insight.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
