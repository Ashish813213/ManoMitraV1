'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/AuthContext';
import MoodModal from '../components/MoodModal';
import {
  fetchCommunities,
  fetchRecommendations,
  fetchResources,
  fetchWorkshops,
  fetchUserStats,
  fetchMoodHistory,
  recordActivity,
  type DashboardCommunity,
  type DashboardRecommendation,
  type DashboardResource,
  type DashboardWorkshop,
  type UserStats,
  type MoodEntry,
  type MoodLogResponse,
} from '../../lib/api';

type DashboardData = {
  recommendations: DashboardRecommendation[];
  resources: DashboardResource[];
  workshops: DashboardWorkshop[];
  communities: DashboardCommunity[];
};

const fallbackData: DashboardData = {
  recommendations: [
    { _id: 'rec-1', title: 'Stress Management 101', type: 'article', score: 85 },
    { _id: 'rec-2', title: 'Sleep Better Tonight', type: 'audio_guide', score: 80 },
    { _id: 'rec-3', title: 'Anxiety Relief', type: 'workshop', score: 75 },
  ],
  resources: [
    { _id: 'resource-1', title: 'Stress Management 101', description: 'Practical steps to reduce daily stress and restore balance.', type: 'article', category: 'stress_management', duration: 5, rating: 4.9 },
    { _id: 'resource-2', title: 'Sleep Better Tonight', description: 'A calming audio guide for better sleep and deeper rest.', type: 'audio_guide', category: 'sleep', duration: 15, rating: 4.8 },
    { _id: 'resource-3', title: 'Anxiety Relief Workshop', description: 'A guided workshop with techniques you can use immediately.', type: 'workshop', category: 'anxiety', duration: 45, rating: 4.7 },
    { _id: 'resource-4', title: 'Start Meditation', description: 'Beginner meditation designed to settle the mind quickly.', type: 'meditation', category: 'mindfulness', duration: 10, rating: 4.9 },
  ],
  workshops: [
    { _id: 'workshop-1', title: 'Sleep and Relaxation Webinar', description: 'Expert discussion on improving sleep quality.', type: 'webinar', category: 'sleep_wellness', scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), duration: 45, facilitatorName: 'Therapist-led', currentParticipants: 0, maxParticipants: 100 },
    { _id: 'workshop-2', title: 'Mindfulness Workshop', description: 'Learn mindfulness techniques for daily practice.', type: 'workshop', category: 'mindfulness', scheduledAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), duration: 90, facilitatorName: 'Therapist-led', currentParticipants: 0, maxParticipants: 20 },
  ],
  communities: [
    { _id: 'community-1', name: 'Anxiety Support Group', description: 'A safe space to talk, learn, and connect.', category: 'anxiety_support', totalMembers: 124 },
    { _id: 'community-2', name: 'Sleep Wellness Community', description: 'Shared routines, tips, and encouragement for better rest.', category: 'sleep_wellness', totalMembers: 82 },
  ],
};

const ACTIVITY_TYPES = [
  { title: 'Morning Meditation', key: 'meditation', time: '7:00 AM', icon: '🧘', minutes: 10 },
  { title: 'Journaling', key: 'journal', time: '8:30 AM', icon: '📝', minutes: 5 },
  { title: 'Mood Check-In', key: 'mood', time: '2:00 PM', icon: '🎯', minutes: 5 },
  { title: 'Breathing Exercise', key: 'exercise', time: '9:00 PM', icon: '💨', minutes: 10 },
];

function getStatsCards(stats: UserStats) {
  return [
    { label: 'Streak', value: `${stats.streak} ${stats.streak === 1 ? 'day' : 'days'}`, icon: '🔥', tone: 'from-amber-500 to-orange-500' },
    { label: 'Sessions', value: String(stats.sessions), icon: '📊', tone: 'from-sky-500 to-cyan-500' },
    { label: 'Progress', value: `${stats.progress}%`, icon: '📈', tone: 'from-emerald-500 to-teal-500' },
    { label: 'Goal', value: stats.goal, icon: '🎯', tone: 'from-indigo-500 to-blue-500' },
  ];
}

function getMoodEmoji(emotion: string): string {
  const map: Record<string, string> = { happy: '😊', sad: '😢', angry: '😠', anxious: '😰', calm: '😌', neutral: '😐', excited: '🤩', confused: '😕', hopeful: '🌟' };
  return map[emotion] ?? '😐';
}

function formatMoodDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diff = Math.floor((now.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

export default function Dashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<DashboardData>(fallbackData);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [completedActivities, setCompletedActivities] = useState<Record<string, boolean>>({});
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const refreshStats = async () => {
    try {
      const res = await fetchUserStats();
      if (res.success) setStats(res.stats);
    } catch {
    }
  };

  const refreshMoodHistory = async () => {
    try {
      const res = await fetchMoodHistory(7);
      if (res.success) setMoodEntries(res.trend);
    } catch {
    }
  };

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function loadDashboard() {
      try {
        setError(null);
        const [
          recRes, resRes, wsRes, comRes, statsRes, moodRes,
        ] = await Promise.all([
          fetchRecommendations(),
          fetchResources(),
          fetchWorkshops(),
          fetchCommunities(),
          fetchUserStats(),
          fetchMoodHistory(7),
        ]);

        if (cancelled) return;

        setData({
          recommendations: recRes.recommendations ?? [],
          resources: resRes.resources ?? fallbackData.resources,
          workshops: wsRes.workshops ?? fallbackData.workshops,
          communities: comRes.communities ?? fallbackData.communities,
        });

        if (statsRes.success) {
          setStats(statsRes.stats);
          const completed: Record<string, boolean> = {};
          if (statsRes.stats.today.exercisesCompleted > 0) completed['meditation'] = true;
          if (statsRes.stats.today.journalEntries > 0) completed['journal'] = true;
          if (statsRes.stats.today.moodCheckIns > 0) completed['mood'] = true;
          setCompletedActivities(completed);
        }

        if (moodRes.success) {
          setMoodEntries(moodRes.trend);
        }
      } catch {
        if (!cancelled) {
          setError('Showing curated wellness content while the API loads.');
          setData(fallbackData);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDashboard();
    return () => { cancelled = true; };
  }, [user]);

  const handleCompleteActivity = async (activityKey: string, type: string, minutes: number) => {
    if (completedActivities[activityKey]) return;
    setCompleting(activityKey);
    try {
      await recordActivity(type as 'mood' | 'exercise' | 'journal' | 'chat', minutes);
      setCompletedActivities((prev) => ({ ...prev, [activityKey]: true }));
      await refreshStats();
    } catch {
      setError('Failed to complete activity. Please try again.');
    } finally {
      setCompleting(null);
    }
  };

  const handleMoodSuccess = (data: MoodLogResponse) => {
    setCompletedActivities((prev) => ({ ...prev, mood: true }));
    refreshStats();
    refreshMoodHistory();
  };

  const todayCompleted = Object.values(completedActivities).filter(Boolean).length;
  const statsCards = stats
    ? getStatsCards(stats)
    : getStatsCards({ streak: 0, sessions: 0, progress: 0, goal: 'Get Started', activeDaysThisWeek: 0, totalMinutes: 0, moodEntriesCount: 0, today: { sessionsCompleted: 0, journalEntries: 0, exercisesCompleted: 0, moodCheckIns: 0, minutesSpent: 0 } });

  const featuredResources = data.resources.length > 0 ? data.resources.slice(0, 3) : fallbackData.resources.slice(0, 3);
  const featuredWorkshops = data.workshops.length > 0 ? data.workshops.slice(0, 2) : fallbackData.workshops.slice(0, 2);
  const featuredCommunities = data.communities.length > 0 ? data.communities.slice(0, 2) : fallbackData.communities.slice(0, 2);

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
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="mb-3 inline-flex rounded-full bg-sky-100 px-4 py-1 text-sm font-semibold text-sky-700">
                Personalized wellness dashboard
              </p>
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
                Welcome back, <span className="text-sky-700">{user?.fullName ?? 'Friend'}</span>
              </h1>
              <p className="mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
                A focused place for stress support, sleep guidance, meditation, therapy, community, and curated resources.
              </p>
              {error && (
                <p className="mt-4 inline-flex rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800">
                  {error}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/get-started" className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800">
                Explore Programs
              </Link>
              <Link href="/contact" className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:border-sky-200 hover:text-sky-700">
                Schedule Support
              </Link>
            </div>
          </div>
        </header>

        <section className="mb-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {statsCards.map((stat) => (
            <div key={stat.label} className="rounded-[1.5rem] border border-white/80 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
              <div className={`mb-4 inline-flex rounded-2xl bg-gradient-to-br ${stat.tone} p-3 text-2xl text-white`}>
                {stat.icon}
              </div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <p className="mt-1 text-3xl font-black tracking-tight">{stat.value}</p>
            </div>
          ))}
        </section>

        <section className="mb-10 grid gap-6 lg:grid-cols-3">
          <div className="rounded-[2rem] border border-white/80 bg-white p-7 shadow-[0_18px_40px_rgba(15,23,42,0.08)] lg:col-span-2">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black tracking-tight">Today&apos;s Activities</h2>
                <p className="text-sm text-slate-500">Tap an activity to mark it complete</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                {todayCompleted}/{ACTIVITY_TYPES.length} completed
              </span>
            </div>
            <div className="space-y-4">
              {ACTIVITY_TYPES.map((activity) => {
                const done = !!completedActivities[activity.key];
                const busy = completing === activity.key;
                return (
                  <button
                    key={activity.title}
                    disabled={done || busy}
                    onClick={() => handleCompleteActivity(activity.key, activity.key, activity.minutes)}
                    className={`w-full flex items-center gap-4 rounded-2xl p-4 transition-all text-left ${
                      done
                        ? 'bg-emerald-50 border-2 border-emerald-200 cursor-default'
                        : busy
                          ? 'bg-slate-100 cursor-wait'
                          : 'bg-slate-50 hover:bg-sky-50 hover:-translate-y-0.5 cursor-pointer'
                    }`}
                  >
                    <span className="text-3xl">{activity.icon}</span>
                    <div className="min-w-0 flex-1">
                      <h3 className={`font-semibold ${done ? 'text-emerald-700 line-through' : 'text-slate-900'}`}>
                        {activity.title}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {done ? 'Completed!' : `${activity.time} &middot; ~${activity.minutes} min`}
                      </p>
                    </div>
                    {busy ? (
                      <span className="h-4 w-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                        done ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'
                      }`}>
                        {done && <span className="text-white text-xs">✓</span>}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/80 bg-slate-950 p-7 text-white shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
            <h2 className="text-2xl font-black tracking-tight">Mood Tracker</h2>
            <p className="mt-1 text-sm text-slate-300">AI-analyzed emotional trends</p>
            <div className="mt-6 space-y-3">
              {moodEntries.length === 0 ? (
                <div className="rounded-2xl bg-white/8 p-4 backdrop-blur-sm">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-2xl">📝</span>
                    <span className="text-xs text-slate-300">No entries</span>
                  </div>
                  <p className="text-sm text-slate-200">Log your mood to see AI insights here.</p>
                </div>
              ) : (
                moodEntries.slice(0, 4).map((entry, idx) => (
                  <div key={idx} className="rounded-2xl bg-white/8 p-4 backdrop-blur-sm">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-2xl">{getMoodEmoji(entry.emotion)}</span>
                      <span className="text-xs text-slate-300">{formatMoodDate(entry.date)}</span>
                    </div>
                    <p className="text-sm font-semibold text-white">{entry.emotion} &middot; {entry.moodScore}/10</p>
                    {entry.note && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">&ldquo;{entry.note}&rdquo;</p>
                    )}
                  </div>
                ))
              )}
            </div>
            <button
              onClick={() => setShowMoodModal(true)}
              className="mt-6 w-full rounded-full bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5"
            >
              {moodEntries.length === 0 ? 'Log Your Mood' : 'Log Another Mood'}
            </button>
          </div>
        </section>

        <section id="resources" className="mb-10">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black tracking-tight">Recommended for You</h2>
              <p className="text-sm text-slate-500">Stress, sleep, and anxiety support picked for the day</p>
            </div>
            <Link href="#featured-actions" className="text-sm font-semibold text-sky-700 hover:text-sky-800">
              Jump to actions
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {featuredResources.map((resource, index) => (
              <article
                key={resource._id}
                className={`group rounded-[1.75rem] p-6 text-white shadow-[0_18px_40px_rgba(15,23,42,0.14)] transition hover:-translate-y-1 ${
                  index === 0 ? 'bg-gradient-to-br from-sky-600 to-cyan-500'
                    : index === 1 ? 'bg-gradient-to-br from-slate-900 to-slate-700'
                    : 'bg-gradient-to-br from-emerald-600 to-teal-500'
                }`}
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/90">
                    {getResourceLabel(resource.type)}
                  </span>
                  <span className="text-3xl">{getResourceIcon(resource.type)}</span>
                </div>
                <h3 className="text-xl font-black">{resource.title}</h3>
                <p className="mt-2 text-sm text-white/85">{resource.description}</p>
                <div className="mt-5 flex items-center justify-between text-xs text-white/80">
                  <span>{resource.duration ? `${resource.duration} min` : 'Flexible length'}</span>
                  <span>{resource.rating ? `${resource.rating.toFixed(1)} rating` : 'Curated'}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mb-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-white/80 bg-white p-7 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tight">Upcoming Workshops</h2>
                <p className="text-sm text-slate-500">Interactive sessions you can join this week</p>
              </div>
              <Link href="/contact" className="text-sm font-semibold text-sky-700 hover:text-sky-800">
                Request therapy
              </Link>
            </div>
            <div className="space-y-4">
              {featuredWorkshops.map((workshop) => (
                <div key={workshop._id} className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-slate-900">{workshop.title}</h3>
                      <p className="mt-1 text-sm text-slate-500">{workshop.description}</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-sky-700 shadow-sm">
                      {workshop.facilitatorName ?? 'Therapist-led'}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3 text-xs font-medium text-slate-600">
                    <span className="rounded-full bg-white px-3 py-1">{workshop.duration ?? 45} min</span>
                    <span className="rounded-full bg-white px-3 py-1">
                      {workshop.currentParticipants ?? 0}/{workshop.maxParticipants ?? 0} seats
                    </span>
                    <span className="rounded-full bg-white px-3 py-1">
                      {workshop.scheduledAt ? new Date(workshop.scheduledAt).toISOString().split('T')[0] : 'Soon'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/80 bg-white p-7 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tight">Communities</h2>
                <p className="text-sm text-slate-500">Join support spaces that match your needs</p>
              </div>
              <Link href="#community-actions" className="text-sm font-semibold text-sky-700 hover:text-sky-800">
                Join now
              </Link>
            </div>
            <div className="space-y-4">
              {featuredCommunities.map((community) => (
                <div key={community._id} className="rounded-2xl border border-slate-100 bg-slate-50 p-5 transition hover:border-sky-200 hover:bg-sky-50">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-slate-900">{community.name}</h3>
                      <p className="mt-1 text-sm text-slate-500">{community.description}</p>
                    </div>
                    <span className="rounded-full bg-sky-600 px-3 py-1 text-xs font-semibold text-white">
                      {community.totalMembers ?? 0} members
                    </span>
                  </div>
                  <div className="mt-4 text-xs font-medium text-slate-500">
                    Category: <span className="font-semibold text-slate-700">{community.category ?? 'general'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="featured-actions" className="mb-10">
          <div className="mb-6">
            <h2 className="text-3xl font-black tracking-tight">Quick Actions</h2>
            <p className="text-sm text-slate-500">Direct paths to the most used wellness features</p>
          </div>
          <div id="community-actions" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'AI Chat', icon: '🤖', href: '/chat', tone: 'from-violet-600 to-fuchsia-600' },
              { label: 'Mood Tracker', icon: '🎯', href: '/mood', tone: 'from-rose-600 to-pink-600' },
              { label: 'Start Meditation', icon: '🧘', href: '/meditation', tone: 'from-indigo-600 to-purple-600' },
              { label: 'Schedule Therapy', icon: '📅', href: '/therapy', tone: 'from-emerald-600 to-teal-600' },
              { label: 'Write Journal', icon: '📝', href: '/journal', tone: 'from-sky-600 to-blue-600' },
              { label: 'Join Community', icon: '👥', href: '/community', tone: 'from-amber-500 to-orange-500' },
              { label: 'View Resources', icon: '📚', href: '/resources', tone: 'from-orange-600 to-red-600' },
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className={`rounded-[1.5rem] bg-gradient-to-br ${action.tone} p-6 text-white shadow-[0_18px_40px_rgba(15,23,42,0.12)] transition hover:-translate-y-1`}
              >
                <div className="text-3xl">{action.icon}</div>
                <p className="mt-4 text-lg font-black">{action.label}</p>
                <p className="mt-1 text-sm text-white/80">Open the wellness flow</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/80 bg-white p-7 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight">Need help?</h2>
              <p className="text-sm text-slate-500">
                If something feels urgent, reach out to the support team right away.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/contact" className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                Contact Support
              </Link>
              <Link href="/about" className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-sky-200 hover:text-sky-700">
                Learn More
              </Link>
            </div>
          </div>
        </section>
      </div>

      <MoodModal isOpen={showMoodModal} onClose={() => setShowMoodModal(false)} onSuccess={handleMoodSuccess} />

      {loading && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/15 backdrop-blur-[2px]">
          <div className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-lg">
            Loading your wellness dashboard...
          </div>
        </div>
      )}
    </main>
  );
}
