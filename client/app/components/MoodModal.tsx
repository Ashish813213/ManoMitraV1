'use client';

import { useState } from 'react';
import { logMood, type MoodLogResponse } from '../../lib/api';

type MoodModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: MoodLogResponse) => void;
};

const MOOD_OPTIONS = [
  { score: 1, label: 'Terrible', emoji: '😭', color: 'from-red-500 to-red-700' },
  { score: 2, label: 'Very Bad', emoji: '😢', color: 'from-red-400 to-orange-500' },
  { score: 3, label: 'Bad', emoji: '😞', color: 'from-orange-400 to-amber-500' },
  { score: 4, label: 'Low', emoji: '🙁', color: 'from-amber-400 to-yellow-500' },
  { score: 5, label: 'Okay', emoji: '😐', color: 'from-yellow-400 to-lime-500' },
  { score: 6, label: 'Fine', emoji: '🙂', color: 'from-lime-400 to-green-500' },
  { score: 7, label: 'Good', emoji: '😊', color: 'from-green-400 to-emerald-500' },
  { score: 8, label: 'Great', emoji: '😄', color: 'from-emerald-400 to-teal-500' },
  { score: 9, label: 'Amazing', emoji: '🤩', color: 'from-teal-400 to-cyan-500' },
  { score: 10, label: 'Perfect', emoji: '🌟', color: 'from-cyan-400 to-sky-500' },
];

export default function MoodModal({ isOpen, onClose, onSuccess }: MoodModalProps) {
  const [selectedScore, setSelectedScore] = useState(5);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<MoodLogResponse | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const data = await logMood(selectedScore, note.trim() || undefined);
      setResult(data);
      onSuccess(data);
    } catch (err: unknown) {
      setResult({
        success: false,
        message: err instanceof Error ? err.message : 'Failed to log mood',
        mood: { score: selectedScore, emotion: 'unknown', sentimentScore: 0, date: new Date().toISOString() },
        aiInsight: 'Could not analyze your mood. Please try again.',
        safetyAlert: null,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedScore(5);
    setNote('');
    setResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden">
        {result ? (
          <div className="p-8">
            <div className="text-center">
              <div className="text-6xl mb-4">
                {MOOD_OPTIONS.find((m) => m.score === result.mood.score)?.emoji ?? '😐'}
              </div>
              <h3 className="text-2xl font-black text-slate-900">Mood Logged!</h3>
              <p className="mt-2 text-slate-600">Score: {result.mood.score}/10 &middot; {result.mood.emotion}</p>
            </div>

            {result.aiInsight && (
              <div className="mt-6 rounded-2xl bg-gradient-to-br from-sky-50 to-indigo-50 border border-sky-100 p-5">
                <p className="text-sm font-semibold text-sky-700 mb-1">AI Insight</p>
                <p className="text-sm text-slate-700">{result.aiInsight}</p>
              </div>
            )}

            {result.safetyAlert?.triggered && (
              <div className="mt-4 rounded-2xl bg-red-50 border border-red-200 p-5">
                <p className="text-sm font-semibold text-red-700 mb-1">Safety Alert</p>
                <p className="text-sm text-red-600">
                  We noticed you may be in distress. Please reach out for support:
                </p>
                <p className="mt-2 text-sm font-bold text-red-700">Crisis Hotline: 1-800-273-8255</p>
              </div>
            )}

            <button
              onClick={handleClose}
              className="mt-6 w-full rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="px-8 pt-8 pb-4">
              <h2 className="text-2xl font-black text-slate-900">How are you feeling?</h2>
              <p className="mt-1 text-sm text-slate-500">Tap your mood score below</p>
            </div>

            <div className="px-8">
              <div className="grid grid-cols-5 gap-2 mb-6">
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

              <div className="mb-4">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  What&apos;s on your mind? <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 resize-none"
                  placeholder="Describe how you're feeling... AI will analyze your emotions..."
                />
              </div>
            </div>

            <div className="px-8 pb-8 flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 rounded-full bg-gradient-to-r from-sky-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:from-sky-700 hover:to-indigo-700 disabled:opacity-60"
              >
                {submitting ? 'Analyzing...' : 'Log Mood'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
