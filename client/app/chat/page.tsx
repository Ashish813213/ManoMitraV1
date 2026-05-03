'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../lib/AuthContext';
import {
  createConversation,
  getConversations,
  getConversation,
  closeConversation,
  sendMessage,
  deleteConversation,
  type ChatConversation,
  type ChatMessage,
} from '../../lib/api';

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

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
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
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getSentimentLabel(score: number): string {
  if (score > 0.3) return 'Positive';
  if (score < -0.3) return 'Negative';
  return 'Neutral';
}

export default function ChatPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    loadConversations();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const res = await getConversations();
      setConversations(res.conversations || []);
    } catch {
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const loadConversation = async (id: string) => {
    try {
      setLoading(true);
      const res = await getConversation(id);
      const rawMessages = res.conversation.messages || [];
      const mappedMessages = rawMessages.map((msg: Record<string, unknown>) => ({
        ...msg,
        sender: msg.role === 'user' ? 'user' : 'ai',
      })) as ChatMessage[];
      setMessages(mappedMessages);
      setActiveConversation(id);
      setSidebarOpen(false);
    } catch {
      setError('Failed to load conversation');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConversation = async () => {
    try {
      const res = await createConversation('New Conversation');
      setConversations((prev) => [res.conversation, ...prev]);
      await loadConversation(res.conversation._id);
    } catch {
      setError('Failed to create conversation');
    }
  };

  const handleSend = useCallback(async () => {
    if (!input.trim() || !activeConversation || sending) return;

    const userMessage = input.trim();
    setInput('');
    setSending(true);

    const tempUserMsg: ChatMessage = {
      _id: `temp-${Date.now()}`,
      conversationId: activeConversation,
      sender: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      console.log('Sending message to conversation:', activeConversation, 'message:', userMessage);
      const res = await sendMessage(activeConversation, userMessage);

      console.log('Send message response:', res);

      // Check if response contains an error (NLP service down)
      if (res.success === false && res.error === 'NLP_SERVICE_ERROR') {
        setError(res.message || 'NLP service is not responding. Please try again later.');
        setMessages((prev) => prev.filter((m) => m._id !== tempUserMsg._id));
        setSending(false);
        return;
      }

      setMessages((prev) => {
        const filtered = prev.filter((m) => m._id !== tempUserMsg._id);
        return [
          ...filtered,
          {
            _id: `user-${Date.now()}`,
            conversationId: activeConversation,
            sender: 'user',
            content: userMessage,
            timestamp: new Date().toISOString(),
          },
          {
            _id: `ai-${Date.now()}`,
            conversationId: activeConversation,
            sender: 'ai',
            content: res.data.aiMessage.content,
            timestamp: new Date().toISOString(),
            reasoning: res.data.reasoning || '',
            suggestions: res.data.suggestions || [],
          },
        ];
      });

    } catch (err: unknown) {
      console.error('Send message error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
      setMessages((prev) => prev.filter((m) => m._id !== tempUserMsg._id));
    } finally {
      setSending(false);
    }
  }, [input, activeConversation, sending]);

  const handleCloseConversation = async () => {
    if (!activeConversation) return;

    try {
      setSending(true);
      await closeConversation(activeConversation);
      await loadConversations();
      setActiveConversation(null);
      setMessages([]);
      setSidebarOpen(true);
    } catch {
      setError('Failed to close conversation');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this conversation?')) return;
    try {
      await deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c._id !== id));
      if (activeConversation === id) {
        setActiveConversation(null);
        setMessages([]);
        setSidebarOpen(true);
      }
    } catch {
      setError('Failed to delete conversation');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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
    <main className="flex h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_35%),linear-gradient(180deg,#f8fbff_0%,#ffffff_55%,#f8fafc_100%)] text-slate-900">
      {sidebarOpen && (
        <aside className="w-80 border-r border-white/80 bg-white/75 backdrop-blur shadow-[0_18px_40px_rgba(15,23,42,0.08)] flex flex-col">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black tracking-tight">AI Chat</h2>
              <Link href="/dashboard" className="text-xs font-semibold text-sky-700 hover:text-sky-800">
                Dashboard
              </Link>
            </div>
            <button
              onClick={handleCreateConversation}
              className="w-full rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              + New Conversation
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {loading ? (
              <div className="grid place-items-center py-10">
                <div className="h-6 w-6 animate-spin rounded-full border-3 border-sky-400 border-t-transparent" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-3xl mb-2">💬</div>
                <p className="text-sm text-slate-500">No conversations yet</p>
                <p className="text-xs text-slate-400 mt-1">Start a new chat to begin</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv._id}
                  onClick={() => loadConversation(conv._id)}
                  className={`w-full text-left rounded-xl p-4 transition-all cursor-pointer ${
                    activeConversation === conv._id
                      ? 'bg-sky-50 border-2 border-sky-200'
                      : 'bg-slate-50 hover:bg-sky-50 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-slate-900 truncate">{conv.title}</h3>
                      <p className="text-xs text-slate-500 mt-1">{formatDate(conv.createdAt || conv.updatedAt)}</p>
                      {typeof conv.sessionSentimentScore === 'number' && (
                        <p className="text-xs text-slate-500 mt-1">
                          Saved score: {conv.sessionSentimentScore.toFixed(3)} {conv.sessionEmotionLabel ? `(${conv.sessionEmotionLabel})` : ''}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleDeleteConversation(conv._id, e)}
                      className="text-slate-400 hover:text-red-500 transition text-xs"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      )}

      <div className="flex-1 flex flex-col">
        {!activeConversation ? (
          <div className="flex-1 grid place-items-center">
            <div className="text-center max-w-md">
              <div className="text-6xl mb-6">🤖</div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900">AI Wellness Chat</h2>
              <p className="mt-3 text-slate-600">
                Talk to our AI-powered wellness assistant. Get emotional support, coping strategies, and personalized guidance.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <button
                  onClick={handleCreateConversation}
                  className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Start New Conversation
                </button>
                {!sidebarOpen && (
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-sky-200 hover:text-sky-700"
                  >
                    View History
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            <header className="flex items-center justify-between px-6 py-4 border-b border-white/80 bg-white/75 backdrop-blur">
              <div className="flex items-center gap-4">
                {!sidebarOpen && (
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="text-slate-500 hover:text-sky-700 transition"
                  >
                    ☰
                  </button>
                )}
                <div>
                  <h2 className="text-lg font-bold text-slate-900">AI Chat</h2>
                  <p className="text-xs text-slate-500">NVIDIA-powered emotional support</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCloseConversation}
                  disabled={sending}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-sky-200 hover:text-sky-700 disabled:opacity-50"
                >
                  Close Chat
                </button>
                <button
                  onClick={handleCreateConversation}
                  className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                >
                  New Chat
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {loading && messages.length === 0 ? (
                <div className="grid place-items-center py-20">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-400 border-t-transparent" />
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg._id}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-5 py-4 ${
                        msg.sender === 'user'
                          ? 'bg-sky-600 text-white rounded-br-md'
                          : 'bg-white border border-slate-100 shadow-sm rounded-bl-md'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <div className={`mt-2 flex items-center justify-between gap-3 ${
                        msg.sender === 'user' ? 'text-sky-200' : 'text-slate-400'
                      }`}>
                        <span className="text-xs">{formatTime(msg.timestamp)}</span>
                        {msg.emotionLabel && (
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            msg.sender === 'user'
                              ? 'bg-sky-500/30 text-sky-100'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {EMOTION_EMOJIS[msg.emotionLabel] || ''} {msg.emotionLabel}
                          </span>
                        )}
                      </div>
                      {/* Show reasoning if available */}
                      {msg.reasoning && (
                        <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <p className="text-xs font-semibold text-slate-500 mb-1">🧠 AI Reasoning:</p>
                          <p className="text-xs text-slate-600 whitespace-pre-wrap">{msg.reasoning}</p>
                        </div>
                      )}
                      {/* Show suggestions if available */}
                      {msg.suggestions && msg.suggestions.length > 0 && (
                        <div className="mt-3 space-y-1">
                          <p className="text-xs font-semibold text-slate-500">💡 Suggestions:</p>
                          {msg.suggestions.map((suggestion, idx) => (
                            <div key={idx} className="text-xs p-2 bg-blue-50 rounded border-l-2 border-blue-400">
                              {suggestion}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              {sending && (
                <div className="flex justify-start">
                  <div className="max-w-[75%] rounded-2xl bg-white border border-slate-100 shadow-sm rounded-bl-md px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-sky-400" style={{ animationDelay: '0ms' }} />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-sky-400" style={{ animationDelay: '150ms' }} />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-sky-400" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

              {error && (
                <div className="mx-6 mb-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-800 flex items-center justify-between">
                  {error}
                  <button onClick={() => setError(null)} className="ml-2 font-bold underline">Dismiss</button>
                </div>
              )}

            <div className="px-6 py-4 border-t border-white/80 bg-white/75 backdrop-blur">
              <div className="flex items-end gap-3">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Share your thoughts... (Enter to send, Shift+Enter for new line)"
                  rows={1}
                  className="flex-1 resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className="rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? '...' : 'Send'}
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-400 text-center">
                AI responses are for wellness support only. For emergencies, contact a professional.
              </p>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
