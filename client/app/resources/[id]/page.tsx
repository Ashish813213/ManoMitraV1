'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/AuthContext';
import { fetchResource, type DashboardResource } from '../../../lib/api';

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

export default function ResourceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [resource, setResource] = useState<DashboardResource | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    if (!params.id) return;

    async function load() {
      try {
        const res = await fetchResource(params.id as string);
        if (res.success) setResource(res.resource);
      } catch {
        router.push('/resources');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id, user, authLoading, router]);

  if (loading || authLoading) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/15 backdrop-blur-[2px]">
        <div className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-lg">Loading...</div>
      </div>
    );
  }

  if (!resource) {
    return (
      <main className="min-h-screen grid place-items-center bg-slate-50">
        <div className="text-center">
          <p className="text-slate-500">Resource not found.</p>
          <Link href="/resources" className="mt-4 inline-block text-sky-700 font-semibold">← Back to Resources</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.15),_transparent_35%),linear-gradient(180deg,#f8fbff_0%,#ffffff_55%,#f8fafc_100%)] text-slate-900">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <Link href="/resources" className="text-sm font-semibold text-sky-700 hover:text-sky-800">← Back to Resources</Link>

        <div className="mt-6 rounded-[2rem] border border-white/80 bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
          <div className="flex items-center justify-between mb-6">
            <span className="rounded-full bg-sky-100 px-4 py-1.5 text-xs font-semibold text-sky-700 uppercase tracking-wide flex items-center gap-2">
              <span>{getResourceIcon(resource.type)}</span>
              {getResourceLabel(resource.type)}
            </span>
            {resource.rating ? (
              <span className="text-sm font-semibold text-amber-600">★ {resource.rating.toFixed(1)}</span>
            ) : null}
          </div>

          <h1 className="text-4xl font-black tracking-tight">{resource.title}</h1>

          {resource.description && (
            <p className="mt-4 text-lg text-slate-600">{resource.description}</p>
          )}

          <div className="mt-8 flex flex-wrap gap-4 text-sm text-slate-500">
            {resource.duration ? (
              <span className="rounded-full bg-slate-100 px-4 py-2 font-medium">⏱ {resource.duration} min</span>
            ) : null}
            {resource.category ? (
              <span className="rounded-full bg-slate-100 px-4 py-2 font-medium">🏷 {resource.category.replace(/_/g, ' ')}</span>
            ) : null}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Back to Dashboard
            </Link>
            <Link
              href="/resources"
              className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-sky-200 hover:text-sky-700"
            >
              Browse More Resources
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
