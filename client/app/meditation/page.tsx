'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/AuthContext';
import { getExercises, completeExercise, logMood, type Exercise } from '../../lib/api';

type ExerciseWithSteps = Exercise & {
  steps?: { instruction: string; durationSeconds: number; phase: string }[];
  benefits?: string[];
  durationMinutes?: number;
};

const PHASE_CONFIG: Record<string, { label: string; color: string; ringColor: string; size: number }> = {
  inhale: { label: 'Inhale', color: 'text-sky-300', ringColor: '#38bdf8', size: 160 },
  hold: { label: 'Hold', color: 'text-violet-300', ringColor: '#c084fc', size: 160 },
  exhale: { label: 'Exhale', color: 'text-emerald-300', ringColor: '#4ade80', size: 80 },
  rest: { label: 'Rest', color: 'text-slate-300', ringColor: '#94a3b8', size: 80 },
  guidance: { label: 'Read', color: 'text-white', ringColor: '#818cf8', size: 120 },
};

const MOOD_OPTIONS = [
  { score: 1, emoji: '😭' }, { score: 2, emoji: '😢' }, { score: 3, emoji: '😞' },
  { score: 4, emoji: '🙁' }, { score: 5, emoji: '😐' }, { score: 6, emoji: '🙂' },
  { score: 7, emoji: '😊' }, { score: 8, emoji: '😄' }, { score: 9, emoji: '🤩' },
  { score: 10, emoji: '🌟' },
];

export default function MeditationPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [exercises, setExercises] = useState<ExerciseWithSteps[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeExercise, setActiveExercise] = useState<ExerciseWithSteps | null>(null);
  const [sessionPhase, setSessionPhase] = useState<'pre-checkin' | 'exercise' | 'post-checkin' | 'complete'>('pre-checkin');
  const [moodBefore, setMoodBefore] = useState(5);
  const [moodAfter, setMoodAfter] = useState(5);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepTimeLeft, setStepTimeLeft] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const totalCycles = 3;
  const [isRunning, setIsRunning] = useState(false);
  const [ringSize, setRingSize] = useState(120);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [typeFilter, setTypeFilter] = useState<'all' | 'breathing' | 'meditation'>('all');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    loadExercises();
  }, [user]);

  async function loadExercises() {
    setLoading(true);
    try {
      const [breathingRes, meditationRes] = await Promise.all([
        getExercises('breathing'),
        getExercises('meditation'),
      ]);
      const combined = [...(breathingRes.exercises || []), ...(meditationRes.exercises || [])] as ExerciseWithSteps[];
      setExercises(combined);
    } catch {}
    setLoading(false);
  }

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const advanceStep = useCallback((exercise: ExerciseWithSteps, stepIdx: number, cycle: number) => {
    if (!exercise.steps?.length) return;
    const nextIdx = stepIdx + 1;
    if (nextIdx >= exercise.steps.length) {
      const nextCycle = cycle + 1;
      if (nextCycle >= totalCycles) { setIsRunning(false); setSessionPhase('post-checkin'); return; }
      setCycleCount(nextCycle);
      setCurrentStepIndex(0);
      const s = exercise.steps[0];
      setStepTimeLeft(s.durationSeconds);
      setRingSize((PHASE_CONFIG[s.phase] || PHASE_CONFIG.guidance).size);
      return;
    }
    setCurrentStepIndex(nextIdx);
    const s = exercise.steps[nextIdx];
    setStepTimeLeft(s.durationSeconds);
    setRingSize((PHASE_CONFIG[s.phase] || PHASE_CONFIG.guidance).size);
  }, [totalCycles]);

  useEffect(() => {
    if (!isRunning || !activeExercise) return;
    stopTimer();
    timerRef.current = setInterval(() => {
      setStepTimeLeft((prev) => {
        if (prev <= 1) { advanceStep(activeExercise, currentStepIndex, cycleCount); return 0; }
        return prev - 1;
      });
    }, 1000);
    return stopTimer;
  }, [isRunning, activeExercise, currentStepIndex, cycleCount, advanceStep, stopTimer]);

  function startExercise() {
    if (!activeExercise?.steps?.length) return;
    setCurrentStepIndex(0); setCycleCount(0);
    const s = activeExercise.steps[0];
    setStepTimeLeft(s.durationSeconds);
    setRingSize((PHASE_CONFIG[s.phase] || PHASE_CONFIG.guidance).size);
    setIsRunning(true); setSessionPhase('exercise');
  }

  async function finishSession() {
    if (!activeExercise) return;
    setSubmitting(true);
    try {
      await Promise.all([
        completeExercise(activeExercise._id, { moodBefore, moodAfter, duration: activeExercise.durationMinutes || 5 }),
        logMood(moodAfter, `Completed ${activeExercise.title}`, 'exercise'),
      ]);
    } catch {}
    setSubmitting(false); setSessionPhase('complete');
  }

  function resetSession() {
    stopTimer(); setActiveExercise(null); setSessionPhase('pre-checkin');
    setIsRunning(false); setCurrentStepIndex(0); setCycleCount(0);
    setMoodBefore(5); setMoodAfter(5);
  }

  const filtered = exercises.filter((ex) => typeFilter === 'all' || ex.type === typeFilter);
  const currentStep = activeExercise?.steps?.[currentStepIndex];
  const phaseCfg = currentStep ? (PHASE_CONFIG[currentStep.phase] || PHASE_CONFIG.guidance) : PHASE_CONFIG.guidance;

  if (authLoading || !user) return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/15 backdrop-blur-[2px]">
      <div className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-lg">Checking authentication...</div>
    </div>
  );

  if (activeExercise) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col">
        <div className="mx-auto max-w-2xl w-full px-4 py-8 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <button onClick={resetSession} className="text-white/60 hover:text-white text-sm font-semibold">✕ Exit</button>
            <h2 className="text-lg font-black">{activeExercise.title}</h2>
            <span className="text-white/60 text-sm">Round {Math.min(cycleCount + 1, totalCycles)}/{totalCycles}</span>
          </div>

          {sessionPhase === 'pre-checkin' && (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <h3 className="text-2xl font-black mb-2">Before we begin...</h3>
              <p className="text-white/70 mb-8">How are you feeling right now?</p>
              <div className="grid grid-cols-5 gap-3 mb-8">
                {MOOD_OPTIONS.map((m) => (
                  <button key={m.score} onClick={() => setMoodBefore(m.score)}
                    className={`flex flex-col items-center gap-1 rounded-2xl p-3 transition-all ${moodBefore === m.score ? 'bg-indigo-600 scale-105' : 'bg-white/10 hover:bg-white/20'}`}>
                    <span className="text-2xl">{m.emoji}</span>
                    <span className="text-xs font-bold">{m.score}</span>
                  </button>
                ))}
              </div>
              <button onClick={startExercise} className="rounded-full bg-indigo-500 px-10 py-4 text-lg font-black hover:bg-indigo-400 transition">
                Begin Exercise →
              </button>
            </div>
          )}

          {sessionPhase === 'exercise' && currentStep && (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="relative flex items-center justify-center mb-8" style={{ width: 220, height: 220 }}>
                <div className="absolute rounded-full border-4 transition-all duration-1000 ease-in-out opacity-30"
                  style={{ width: ringSize * 1.4, height: ringSize * 1.4, borderColor: phaseCfg.ringColor, background: `radial-gradient(circle, ${phaseCfg.ringColor}20, transparent)` }} />
                <div className="absolute rounded-full border-4 transition-all duration-1000 ease-in-out"
                  style={{ width: ringSize, height: ringSize, borderColor: phaseCfg.ringColor, boxShadow: `0 0 40px ${phaseCfg.ringColor}60` }} />
                <div className="relative text-center z-10">
                  <p className={`text-4xl font-black ${phaseCfg.color}`}>{stepTimeLeft}</p>
                  <p className={`text-sm font-bold ${phaseCfg.color}`}>{phaseCfg.label}</p>
                </div>
              </div>
              <p className="text-xl text-white/90 mb-6 max-w-sm leading-relaxed">{currentStep.instruction}</p>
              <div className="flex gap-2 mb-8">
                {activeExercise.steps?.map((_, i) => (
                  <div key={i} className={`h-1.5 rounded-full transition-all ${i === currentStepIndex ? 'w-8 bg-indigo-400' : i < currentStepIndex ? 'w-4 bg-white/40' : 'w-4 bg-white/20'}`} />
                ))}
              </div>
              <button onClick={() => { setIsRunning(false); setSessionPhase('post-checkin'); }} className="text-white/40 text-sm hover:text-white/70 transition">End early</button>
            </div>
          )}

          {sessionPhase === 'post-checkin' && (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="text-2xl font-black mb-2">Great work!</h3>
              <p className="text-white/70 mb-8">How are you feeling now?</p>
              <div className="grid grid-cols-5 gap-3 mb-8">
                {MOOD_OPTIONS.map((m) => (
                  <button key={m.score} onClick={() => setMoodAfter(m.score)}
                    className={`flex flex-col items-center gap-1 rounded-2xl p-3 transition-all ${moodAfter === m.score ? 'bg-emerald-600 scale-105' : 'bg-white/10 hover:bg-white/20'}`}>
                    <span className="text-2xl">{m.emoji}</span>
                    <span className="text-xs font-bold">{m.score}</span>
                  </button>
                ))}
              </div>
              <button onClick={finishSession} disabled={submitting}
                className="rounded-full bg-emerald-500 px-10 py-4 text-lg font-black hover:bg-emerald-400 disabled:opacity-60 transition">
                {submitting ? 'Saving...' : 'Save & Finish'}
              </button>
            </div>
          )}

          {sessionPhase === 'complete' && (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="text-5xl mb-4">✨</div>
              <h3 className="text-2xl font-black mb-2">Session Complete!</h3>
              <div className="bg-white/10 rounded-2xl p-6 mb-8 w-full max-w-sm">
                <div className="flex justify-around">
                  <div><p className="text-white/60 text-sm">Before</p><p className="text-3xl font-black">{MOOD_OPTIONS[moodBefore - 1]?.emoji} {moodBefore}</p></div>
                  <div className="text-white/40 text-2xl self-center">→</div>
                  <div><p className="text-white/60 text-sm">After</p><p className="text-3xl font-black">{MOOD_OPTIONS[moodAfter - 1]?.emoji} {moodAfter}</p></div>
                </div>
                {moodAfter > moodBefore && <p className="text-emerald-400 font-semibold mt-3 text-sm">+{moodAfter - moodBefore} mood improvement! 📈</p>}
              </div>
              <div className="flex gap-3">
                <button onClick={resetSession} className="rounded-full bg-white/20 px-6 py-3 font-semibold hover:bg-white/30 transition">Try Another</button>
                <Link href="/dashboard" className="rounded-full bg-indigo-500 px-6 py-3 font-semibold hover:bg-indigo-400 transition">Dashboard</Link>
              </div>
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.15),_transparent_35%),linear-gradient(180deg,#f8fbff_0%,#ffffff_55%,#f8fafc_100%)] text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-10">
          <Link href="/dashboard" className="text-sm font-semibold text-violet-700 hover:text-violet-800">← Back to Dashboard</Link>
          <h1 className="mt-4 text-4xl font-black tracking-tight">🧘 Meditation & Breathing</h1>
          <p className="mt-2 text-slate-600">Guided exercises with animated breathing coach and mood tracking</p>
        </header>
        <div className="flex gap-3 mb-8">
          {(['all', 'breathing', 'meditation'] as const).map((t) => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${typeFilter === t ? 'bg-violet-600 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:border-violet-300'}`}>
              {t === 'all' ? 'All' : t === 'breathing' ? '🫁 Breathing' : '🧘 Meditation'}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="grid place-items-center py-20"><div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-400 border-t-transparent" /></div>
        ) : filtered.length === 0 ? (
          <div className="rounded-[2rem] bg-white border p-12 text-center">
            <p className="text-slate-500">No exercises found. Make sure exercises are seeded with <code>node backend/seed-exercises.js</code></p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((ex) => (
              <div key={ex._id} className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)] flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${ex.difficulty === 'easy' ? 'bg-emerald-100 text-emerald-700' : ex.difficulty === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{ex.difficulty}</span>
                  <span className="text-3xl">{ex.type === 'breathing' ? '🫁' : '🧘'}</span>
                </div>
                <h3 className="text-xl font-bold">{ex.title}</h3>
                <p className="mt-2 text-sm text-slate-600 flex-1">{ex.description}</p>
                {(ex as ExerciseWithSteps).benefits && (ex as ExerciseWithSteps).benefits!.length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {(ex as ExerciseWithSteps).benefits!.slice(0, 2).map((b, i) => (
                      <li key={i} className="text-xs text-slate-500 flex items-start gap-1"><span className="text-violet-400 mt-0.5">✓</span> {b}</li>
                    ))}
                  </ul>
                )}
                <div className="mt-5 flex items-center justify-between">
                  <span className="text-sm text-slate-500">{(ex as ExerciseWithSteps).durationMinutes || 5} min</span>
                  <button onClick={() => { setActiveExercise(ex); setSessionPhase('pre-checkin'); }}
                    className="rounded-full bg-violet-600 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-700 transition">
                    Start
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
