'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../lib/AuthContext';
import {
  createJournalEntry,
  getJournalEntries,
  updateJournalEntry,
  deleteJournalEntry,
  getJournalTrends,
  type JournalEntry,
  type JournalTrendData,
} from '../../lib/api';

type ViewMode = 'list' | 'create' | 'edit' | 'trends';

const EMOTION_COLORS: Record<string, string> = {
  sad: 'bg-blue-500',
  happy: 'bg-yellow-500',
  angry: 'bg-red-500',
  anxious: 'bg-purple-500',
  calm: 'bg-green-500',
  neutral: 'bg-gray-500',
  excited: 'bg-orange-500',
  confused: 'bg-indigo-500',
  hopeful: 'bg-teal-500',
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
  if (score > 0.3) return 'text-green-600 bg-green-50';
  if (score < -0.3) return 'text-red-600 bg-red-50';
  return 'text-gray-600 bg-gray-50';
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
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function getDateKey(dateStr: string): string {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function groupEntriesByDate(entries: JournalEntry[]): Map<string, JournalEntry[]> {
  const grouped = new Map<string, JournalEntry[]>();
  
  entries.forEach((entry) => {
    const dateKey = getDateKey(entry.createdAt);
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }
    grouped.get(dateKey)!.push(entry);
  });
  
  return new Map([...grouped].reverse());
}

function logAnalysisToStore(entry: JournalEntry): void {
  try {
    const analysis = {
      entryId: entry._id,
      date: new Date(entry.createdAt).toISOString(),
      mood: entry.moodScore,
      emotion: entry.detectedEmotion,
      sentiment: entry.sentimentScore,
      title: entry.title,
      tags: entry.tags,
      timestamp: Date.now(),
    };
    
    const existing = JSON.parse(localStorage.getItem('journalAnalytics') || '[]');
    existing.push(analysis);
    localStorage.setItem('journalAnalytics', JSON.stringify(existing));
  } catch (err) {
    console.error('Failed to log analysis:', err);
  }
}

export default function JournalPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [view, setView] = useState<ViewMode>('list');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [trends, setTrends] = useState<JournalTrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [trendDays, setTrendDays] = useState(30);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEmotion, setFilterEmotion] = useState<string | null>(null);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    loadEntries();
  }, [user]);

  const loadEntries = async (search?: string, emotion?: string | null, tag?: string | null) => {
    try {
      setLoading(true);
      const res = await getJournalEntries(50, 0, 'createdAt', search, emotion || undefined, tag || undefined);
      setEntries(res.journals || []);
    } catch {
      setError('Failed to load journal entries');
    } finally {
      setLoading(false);
    }
  };

  const loadTrends = async () => {
    try {
      setLoading(true);
      const res = await getJournalTrends(trendDays);
      setTrends(res.data);
    } catch {
      setError('Failed to load trends');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Title and content are required');
      return;
    }
    setSaving(true);
    try {
      await createJournalEntry({
        title: formData.title,
        content: formData.content,
        moodScore: 5,
        tags: [],
      });
      setFormData({ title: '', content: '' });
      setView('list');
      await loadEntries();
      // Log analysis for all entries
      const res = await getJournalEntries(50);
      if (res.journals) {
        res.journals.forEach(entry => logAnalysisToStore(entry));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create entry');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedEntry || !formData.title.trim() || !formData.content.trim()) {
      setError('Title and content are required');
      return;
    }
    setSaving(true);
    try {
      await updateJournalEntry(selectedEntry._id, {
        title: formData.title,
        content: formData.content,
        moodScore: selectedEntry.moodScore,
        tags: selectedEntry.tags || [],
      });
      setFormData({ title: '', content: '' });
      setSelectedEntry(null);
      setView('list');
      await loadEntries();
      // Log analysis for all entries
      const res = await getJournalEntries(50);
      if (res.journals) {
        res.journals.forEach(entry => logAnalysisToStore(entry));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update entry');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    setDeleting(id);
    try {
      await deleteJournalEntry(id);
      setEntries((prev) => prev.filter((e) => e._id !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete entry');
    } finally {
      setDeleting(null);
    }
  };

  const startEdit = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setFormData({
      title: entry.title,
      content: entry.content,
    });
    setView('edit');
  };

  const startCreate = () => {
    setFormData({ title: '', content: '' });
    setView('create');
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    loadEntries(query, filterEmotion, filterTag);
  };

  const handleFilterEmotion = (emotion: string | null) => {
    setFilterEmotion(emotion);
    loadEntries(searchQuery, emotion, filterTag);
  };

  const handleFilterTag = (tag: string | null) => {
    setFilterTag(tag);
    loadEntries(searchQuery, filterEmotion, tag);
  };

  const showTrends = () => {
    setView('trends');
    loadTrends();
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

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_35%),linear-gradient(180deg,#f8fbff_0%,#ffffff_55%,#f8fafc_100%)] text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-10 overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-3 inline-flex rounded-full bg-sky-100 px-4 py-1 text-sm font-semibold text-sky-700">
                Your personal journal
              </p>
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
                <span className="text-sky-700">Journal</span>
              </h1>
              <p className="mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
                Write, reflect, and track your emotional journey with AI-powered sentiment analysis.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={startCreate}
                className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                New Entry
              </button>
              <button
                onClick={showTrends}
                className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:border-sky-200 hover:text-sky-700"
              >
                View Trends
              </button>
              {view !== 'list' && (
                <button
                  onClick={() => setView('list')}
                  className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:border-sky-200 hover:text-sky-700"
                >
                  Back to List
                </button>
              )}
            </div>
          </div>
        </header>

        {error && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">
            {error}
            <button onClick={() => setError(null)} className="ml-4 font-bold underline">Dismiss</button>
          </div>
        )}

        {view === 'list' && (
          <section>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-black tracking-tight">Recent Entries</h2>
              <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                {entries.length} entries
              </span>
            </div>

            {/* Search Bar */}
            <div className="mb-6 flex flex-col gap-4">
              <input
                type="text"
                placeholder="Search entries by title or content..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
              
              {/* Filter Controls */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleFilterEmotion(filterEmotion ? null : null)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                    filterEmotion ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Clear Emotion Filter
                </button>
                <button
                  onClick={() => handleFilterTag(filterTag ? null : null)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                    filterTag ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Clear Tag Filter
                </button>
              </div>
              
              {/* Active Filters Display */}
              {(searchQuery || filterEmotion || filterTag) && (
                <div className="rounded-lg bg-sky-50 p-3 text-sm">
                  <span className="font-semibold text-sky-900">Active filters: </span>
                  {searchQuery && <span className="ml-2 inline-block rounded bg-sky-200 px-2 py-1">Search: {searchQuery}</span>}
                  {filterEmotion && <span className="ml-2 inline-block rounded bg-sky-200 px-2 py-1">Emotion: {filterEmotion}</span>}
                  {filterTag && <span className="ml-2 inline-block rounded bg-sky-200 px-2 py-1">Tag: {filterTag}</span>}
                </div>
              )}
            </div>

            {loading ? (
              <div className="grid place-items-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-400 border-t-transparent" />
              </div>
            ) : entries.length === 0 ? (
              <div className="rounded-[2rem] border border-white/80 bg-white p-12 text-center shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                <div className="text-5xl mb-4">📝</div>
                <h3 className="text-xl font-bold text-slate-700">No journal entries yet</h3>
                <p className="mt-2 text-slate-500">Start writing to track your emotional journey.</p>
                <button
                  onClick={startCreate}
                  className="mt-6 rounded-full bg-sky-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
                >
                  Create Your First Entry
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {Array.from(groupEntriesByDate(entries)).map(([dateKey, dateEntries]) => {
                  const displayDate = new Date(dateKey + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  });
                  return (
                    <div key={dateKey}>
                      <h3 className="mb-4 text-lg font-black text-slate-900">{displayDate}</h3>
                      <div className="grid gap-6 md:grid-cols-3">
                        {dateEntries.map((entry) => (
                          <article
                            key={entry._id}
                            className="group rounded-[1.5rem] border border-white/80 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)] transition hover:-translate-y-1"
                          >
                            <div className="mb-4 flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-slate-900">{entry.title}</h3>
                                <p className="mt-1 text-xs text-slate-500">{formatTime(entry.createdAt)}</p>
                              </div>
                              <span className={`rounded-full px-2 py-1 text-xs font-semibold ${getSentimentColor(entry.sentimentScore || 0)}`}>
                                {getSentimentLabel(entry.sentimentScore || 0)}
                              </span>
                            </div>

                            <p className="mb-4 line-clamp-3 text-sm text-slate-600">{entry.content}</p>

                            <div className="mb-4 flex flex-wrap items-center gap-3">
                              <div className="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1">
                                <span>{EMOTION_EMOJIS[entry.detectedEmotion] || '😐'}</span>
                                <span className="text-xs font-medium text-slate-700 capitalize">{entry.detectedEmotion}</span>
                              </div>
                              <div className="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1">
                                <span className="text-xs font-medium text-slate-700">Mood: {entry.moodScore}/10</span>
                              </div>
                            </div>

                            {entry.tags && entry.tags.length > 0 && (
                              <div className="mb-4 flex flex-wrap gap-2">
                                {entry.tags.map((tag) => (
                                  <span key={tag} className="rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700">
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="flex items-center gap-2 border-t border-slate-100 pt-4">
                              <button
                                onClick={() => startEdit(entry)}
                                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-50"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(entry._id)}
                                disabled={deleting === entry._id}
                                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                              >
                                {deleting === entry._id ? 'Deleting...' : 'Delete'}
                              </button>
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {(view === 'create' || view === 'edit') && (
          <section className="rounded-[2rem] border border-white/80 bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
            <h2 className="mb-6 text-2xl font-black tracking-tight">
              {view === 'create' ? 'New Journal Entry' : 'Edit Entry'}
            </h2>

            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  placeholder="How are you feeling today?"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Content</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                  rows={8}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  placeholder="Write your thoughts here..."
                />
              </div>

              <div className="rounded-lg bg-sky-50 border border-sky-200 p-4">
                <p className="text-sm text-sky-700">💡 <strong>Auto-Analysis:</strong> Mood and emotion will be automatically detected by our AI based on your content.</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={view === 'create' ? handleCreate : handleUpdate}
                  disabled={saving}
                  className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : view === 'create' ? 'Create Entry' : 'Update Entry'}
                </button>
                <button
                  onClick={() => { setView('list'); setSelectedEntry(null); }}
                  className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-sky-200 hover:text-sky-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </section>
        )}

        {view === 'trends' && (
          <section className="space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-2xl font-black tracking-tight">Emotional Trends</h2>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-slate-600">Period:</label>
                <select
                  value={trendDays}
                  onChange={(e) => { setTrendDays(parseInt(e.target.value)); }}
                  onBlur={loadTrends}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none"
                >
                  <option value={7}>7 days</option>
                  <option value={30}>30 days</option>
                  <option value={90}>90 days</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="grid place-items-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-400 border-t-transparent" />
              </div>
            ) : trends ? (
              <>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-[1.5rem] border border-white/80 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                    <p className="text-sm font-medium text-slate-500">Total Entries</p>
                    <p className="mt-2 text-3xl font-black text-slate-900">{trends.journalCount}</p>
                  </div>
                  <div className="rounded-[1.5rem] border border-white/80 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                    <p className="text-sm font-medium text-slate-500">Average Mood</p>
                    <p className="mt-2 text-3xl font-black text-slate-900">{trends.averageMood}/10</p>
                  </div>
                  <div className="rounded-[1.5rem] border border-white/80 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                    <p className="text-sm font-medium text-slate-500">Avg Sentiment</p>
                    <p className={`mt-2 text-3xl font-black ${getSentimentColor(trends.averageSentiment).split(' ')[0]}`}>
                      {trends.averageSentiment.toFixed(2)}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-white/80 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                    <p className="text-sm font-medium text-slate-500">Mood Range</p>
                    <p className="mt-2 text-3xl font-black text-slate-900">{trends.lowestMood} - {trends.highestMood}</p>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-white/80 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                    <h3 className="mb-4 text-lg font-bold text-slate-900">Mood Trend</h3>
                    <div className="space-y-2">
                      {trends.moodTrend.slice(-10).map((point, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <span className="w-20 text-xs text-slate-500">{formatDate(point.date)}</span>
                          <div className="flex-1 rounded-full bg-slate-100">
                            <div
                              className="h-6 rounded-full bg-gradient-to-r from-sky-400 to-sky-600 transition-all"
                              style={{ width: `${point.mood * 10}%` }}
                            />
                          </div>
                          <span className="w-10 text-right text-xs font-semibold text-slate-700">{point.mood}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-white/80 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                    <h3 className="mb-4 text-lg font-bold text-slate-900">Sentiment Trend</h3>
                    <div className="space-y-2">
                      {trends.sentimentTrend.slice(-10).map((point, idx) => {
                        const barWidth = Math.abs(point.sentiment) * 100;
                        const isPositive = point.sentiment >= 0;
                        return (
                          <div key={idx} className="flex items-center gap-3">
                            <span className="w-20 text-xs text-slate-500">{formatDate(point.date)}</span>
                            <div className="flex-1 rounded-full bg-slate-100">
                              <div
                                className={`h-6 rounded-full transition-all ${isPositive ? 'bg-gradient-to-r from-green-400 to-green-600' : 'bg-gradient-to-r from-red-400 to-red-600'}`}
                                style={{ width: `${Math.max(barWidth, 5)}%` }}
                              />
                            </div>
                            <span className="w-12 text-right text-xs font-semibold text-slate-700">{point.sentiment.toFixed(2)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-white/80 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                    <h3 className="mb-4 text-lg font-bold text-slate-900">Emotion Distribution</h3>
                    <div className="space-y-3">
                      {Object.entries(trends.emotionDistribution)
                        .sort((a, b) => b[1] - a[1])
                        .map(([emotion, count]) => {
                          const total = trends.journalCount;
                          const percentage = ((count / total) * 100).toFixed(0);
                          return (
                            <div key={emotion} className="flex items-center gap-3">
                              <span className="text-lg">{EMOTION_EMOJIS[emotion] || '😐'}</span>
                              <span className="w-20 text-sm font-medium capitalize text-slate-700">{emotion}</span>
                              <div className="flex-1 rounded-full bg-slate-100">
                                <div
                                  className={`h-5 rounded-full ${EMOTION_COLORS[emotion] || 'bg-gray-500'}`}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="w-10 text-right text-xs font-semibold text-slate-600">{count}</span>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-white/80 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                    <h3 className="mb-4 text-lg font-bold text-slate-900">Top Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(trends.tagFrequency).length === 0 ? (
                        <p className="text-sm text-slate-500">No tags used yet</p>
                      ) : (
                        Object.entries(trends.tagFrequency)
                          .sort((a, b) => b[1] - a[1])
                          .map(([tag, count]) => (
                            <span
                              key={tag}
                              className="rounded-full bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-700"
                            >
                              #{tag} <span className="text-sky-500">({count})</span>
                            </span>
                          ))
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-[2rem] border border-white/80 bg-white p-12 text-center shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                <div className="text-5xl mb-4">📈</div>
                <h3 className="text-xl font-bold text-slate-700">No trend data available</h3>
                <p className="mt-2 text-slate-500">Create some journal entries to see your emotional trends.</p>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
