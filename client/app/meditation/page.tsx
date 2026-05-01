'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { getExercises, completeExercise, recordActivity, type Exercise } from '../../lib/api';

const modules = [
  { title: 'Breathing Basics', type: 'breathing', difficulty: 'beginner', duration: 10, description: 'Learn foundational breathing techniques' },
  { title: 'Mindfulness 101', type: 'meditation', difficulty: 'beginner', duration: 15, description: 'Introduction to present-moment awareness' },
  { title: 'Body Scan', type: 'meditation', difficulty: 'beginner', duration: 20, description: 'Progressive relaxation from head to toe' },
  { title: 'Loving Kindness', type: 'meditation', difficulty: 'intermediate', duration: 25, description: 'Cultivate compassion for self and others' },
  { title: 'Advanced Focus', type: 'meditation', difficulty: 'advanced', duration: 30, description: 'Deep concentration and mental clarity' },
];

export default function MeditationPage() {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadExercises();
  }, []);

  async function loadExercises() {
    try {
      const res = await getExercises('meditation');
      if (res.success) setExercises(res.exercises);
    } catch {}
    setLoading(false);
  }

  const filteredModules = modules.filter(m =>
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    m.description.toLowerCase().includes(search.toLowerCase())
  );

  function startModule(mod: typeof modules[0]) {
    setActiveModule(mod.title);
    setTimer(mod.duration * 60);
    setIsRunning(true);
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsRunning(false);
          completeModule(mod);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function completeModule(mod: typeof modules[0]) {
    try {
      await recordActivity('exercise', mod.duration);
    } catch {}
    setActiveModule(null);
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.15),_transparent_35%),linear-gradient(180deg,#f8fbff_0%,#ffffff_55%,#f8fafc_100%)] text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-10">
          <Link href="/dashboard" className="text-sm font-semibold text-violet-700 hover:text-violet-800">← Back to Dashboard</Link>
          <h1 className="mt-4 text-4xl font-black tracking-tight">🧘 Meditation Modules</h1>
          <p className="mt-2 text-slate-600">Learning modules to guide your meditation journey</p>
        </header>

        <div className="mb-8 flex gap-4">
          <input
            type="text"
            placeholder="Search modules..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm focus:border-violet-400 focus:outline-none"
          />
        </div>

        {activeModule && (
          <div className="mb-8 rounded-[2rem] bg-gradient-to-br from-violet-600 to-fuchsia-600 p-8 text-white shadow-xl">
            <h2 className="text-2xl font-black">{activeModule}</h2>
            <div className="mt-4 text-6xl font-black">{formatTime(timer)}</div>
            <p className="mt-2 text-white/80">Meditating... Find your calm.</p>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredModules.map((mod) => (
            <div key={mod.title} className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
              <div className="mb-4 flex items-center justify-between">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  mod.difficulty === 'beginner' ? 'bg-emerald-100 text-emerald-700' :
                  mod.difficulty === 'intermediate' ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {mod.difficulty}
                </span>
                <span className="text-3xl">🧘</span>
              </div>
              <h3 className="text-xl font-bold">{mod.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{mod.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-slate-500">{mod.duration} min</span>
                <button
                  onClick={() => startModule(mod)}
                  disabled={isRunning}
                  className="rounded-full bg-violet-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
                >
                  {isRunning ? 'In Progress...' : 'Start Module'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {exercises.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-6 text-2xl font-black">Additional Exercises</h2>
            <div className="grid gap-4">
              {exercises.map((ex) => (
                <div key={ex._id} className="rounded-2xl border border-slate-100 bg-white p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900">{ex.title}</h3>
                      <p className="mt-1 text-sm text-slate-500">{ex.description}</p>
                      <div className="mt-2 flex gap-2 text-xs text-slate-600">
                        <span className="rounded-full bg-slate-50 px-3 py-1">{ex.duration} min</span>
                        <span className="rounded-full bg-slate-50 px-3 py-1">{ex.difficulty}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
