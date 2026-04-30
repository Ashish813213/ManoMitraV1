const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('token', token);
}

function removeToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.message || `Request failed: ${response.status}`);
  }

  return response.json();
}

// Auth types
export type AuthUser = {
  _id: string;
  fullName: string;
  email: string;
  role: string;
};

export type AuthResponse = {
  success: boolean;
  message: string;
  user: AuthUser;
  token: string;
};

export type RegisterPayload = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

// Auth API functions
export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (data.token) {
    setToken(data.token);
  }
  return data;
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (data.token) {
    setToken(data.token);
  }
  return data;
}

export async function getProfile(): Promise<{ success: boolean; user: AuthUser }> {
  return apiFetch('/users/profile');
}

export function logout(): void {
  removeToken();
}

// Dashboard types
export type DashboardResource = {
  _id: string;
  title: string;
  description?: string;
  type: 'article' | 'audio_guide' | 'workshop' | 'video' | 'meditation' | 'exercise';
  category?: string;
  duration?: number;
  rating?: number;
  imageUrl?: string;
};

export type DashboardWorkshop = {
  _id: string;
  title: string;
  description?: string;
  type?: string;
  category?: string;
  scheduledAt?: string;
  duration?: number;
  maxParticipants?: number;
  currentParticipants?: number;
  facilitatorName?: string;
  imageUrl?: string;
};

export type DashboardCommunity = {
  _id: string;
  name: string;
  description?: string;
  category?: string;
  totalMembers?: number;
  imageUrl?: string;
};

export type DashboardRecommendation = {
  _id: string;
  score?: number;
  reason?: string;
  resource?: DashboardResource;
};

export async function fetchRecommendations() {
  return apiFetch<{ success?: boolean; recommendations?: DashboardRecommendation[] }>(
    '/recommendations?limit=3'
  );
}

export async function fetchTrendingResources() {
  return apiFetch<{ success?: boolean; resources?: DashboardResource[] }>('/recommendations/trending');
}

export async function fetchWorkshops() {
  return apiFetch<{ success?: boolean; workshops?: DashboardWorkshop[] }>('/workshops?limit=3');
}

export async function fetchCommunities() {
  return apiFetch<{ success?: boolean; communities?: DashboardCommunity[] }>('/community?limit=3');
}

export async function fetchResources() {
  return apiFetch<{ success?: boolean; resources?: DashboardResource[] }>('/resources?limit=6');
}

// Stats types
export type UserStats = {
  streak: number;
  sessions: number;
  progress: number;
  goal: string;
  activeDaysThisWeek: number;
  totalMinutes: number;
  moodEntriesCount: number;
  today: {
    sessionsCompleted: number;
    journalEntries: number;
    exercisesCompleted: number;
    moodCheckIns: number;
    minutesSpent: number;
  };
};

export async function fetchUserStats(): Promise<{ success: boolean; stats: UserStats }> {
  return apiFetch('/users/stats');
}

export type ActivityType = 'mood' | 'exercise' | 'journal' | 'chat';

export async function recordActivity(type: ActivityType, minutes?: number): Promise<{ success: boolean; activity: { streakCount: number; sessionsCompleted: number; minutesSpent: number } }> {
  return apiFetch('/users/activity', {
    method: 'POST',
    body: JSON.stringify({ type, minutes }),
  });
}

// Mood types
export type MoodEntry = {
  date: string;
  moodScore: number;
  emotion: string;
  note?: string;
  activity?: string;
  source: string;
};

export type MoodLogResponse = {
  success: boolean;
  message: string;
  mood: {
    score: number;
    emotion: string;
    sentimentScore: number;
    date: string;
    note?: string;
  };
  aiInsight: string;
  safetyAlert?: { triggered: boolean; level: string } | null;
};

export async function logMood(moodScore: number, note?: string, activity?: string): Promise<MoodLogResponse> {
  return apiFetch('/mood/log', {
    method: 'POST',
    body: JSON.stringify({ moodScore, note, activity }),
  });
}

export async function fetchMoodHistory(days?: number): Promise<{ success: boolean; count: number; trend: MoodEntry[] }> {
  return apiFetch(`/mood/recent?days=${days || 7}`);
}

// Chat types
export type ChatConversation = {
  _id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  lastMessage?: string;
};

export type ChatMessage = {
  _id: string;
  conversationId: string;
  sender: 'user' | 'ai';
  content: string;
  timestamp: string;
};

export type ChatResponse = {
  success: boolean;
  message: string;
  data: {
    userMessage: ChatMessage;
    aiMessage: ChatMessage;
    analysis: { emotion: string; sentiment: { sentiment_score: number } };
    safetyAlert?: { message: string; level: string; timestamp: string } | null;
  };
};

// Chat API functions
export async function createConversation(title?: string): Promise<{ success: boolean; conversation: ChatConversation }> {
  return apiFetch('/chat/conversations', {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
}

export async function getConversations(): Promise<{ success: boolean; conversations: ChatConversation[]; count: number }> {
  return apiFetch('/chat/conversations');
}

export async function getConversation(conversationId: string): Promise<{ success: boolean; conversation: ChatConversation & { messages: ChatMessage[] } }> {
  return apiFetch(`/chat/conversations/${conversationId}`);
}

export async function sendMessage(conversationId: string, message: string, emotion?: string): Promise<ChatResponse> {
  return apiFetch('/chat/messages', {
    method: 'POST',
    body: JSON.stringify({ conversationId, message, emotion }),
  });
}

export async function deleteConversation(conversationId: string): Promise<{ success: boolean; message: string }> {
  return apiFetch(`/chat/conversations/${conversationId}`, { method: 'DELETE' });
}

// Exercise types
export type Exercise = {
  _id: string;
  title: string;
  description: string;
  type: string;
  duration: number;
  difficulty: string;
  instructions?: string[];
  imageUrl?: string;
  isActive: boolean;
};

export async function getExercises(type?: string, difficulty?: string): Promise<{ success: boolean; exercises: Exercise[]; count: number }> {
  const query = new URLSearchParams();
  if (type) query.append('type', type);
  if (difficulty) query.append('difficulty', difficulty);
  return apiFetch(`/exercises${query.toString() ? '?' + query.toString() : ''}`);
}

export async function getExercise(id: string): Promise<{ success: boolean; exercise: Exercise }> {
  return apiFetch(`/exercises/${id}`);
}

export type ExerciseCompletion = {
  moodBefore: number;
  moodAfter: number;
  feedback?: string;
  duration: number;
};

export async function completeExercise(exerciseId: string, data: ExerciseCompletion): Promise<{ success: boolean; message: string; moodImprovement: number }> {
  return apiFetch(`/exercises/${exerciseId}/complete`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Journal types
export type JournalEntry = {
  _id: string;
  title: string;
  content: string;
  mood: number;
  emotion: string;
  tags: string[];
  createdAt: string;
  insights?: string;
};

export async function createJournalEntry(title: string, content: string, mood?: number, emotion?: string, tags?: string[]): Promise<{ success: boolean; entry: JournalEntry }> {
  return apiFetch('/journals', {
    method: 'POST',
    body: JSON.stringify({ title, content, mood, emotion, tags }),
  });
}

export async function getJournalEntries(limit?: number): Promise<{ success: boolean; entries: JournalEntry[]; count: number }> {
  const query = limit ? `?limit=${limit}` : '';
  return apiFetch(`/journals${query}`);
}

export async function getJournalEntry(id: string): Promise<{ success: boolean; entry: JournalEntry }> {
  return apiFetch(`/journals/${id}`);
}

export async function updateJournalEntry(id: string, data: Partial<JournalEntry>): Promise<{ success: boolean; entry: JournalEntry }> {
  return apiFetch(`/journals/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteJournalEntry(id: string): Promise<{ success: boolean; message: string }> {
  return apiFetch(`/journals/${id}`, { method: 'DELETE' });
}

// Workshop registration
export async function registerForWorkshop(workshopId: string): Promise<{ success: boolean; message: string }> {
  return apiFetch(`/workshops/${workshopId}/register`, { method: 'POST', body: JSON.stringify({}) });
}

export async function unregisterFromWorkshop(workshopId: string): Promise<{ success: boolean; message: string }> {
  return apiFetch(`/workshops/${workshopId}/cancel`, { method: 'POST', body: JSON.stringify({}) });
}

// Community functions
export async function joinCommunity(communityId: string): Promise<{ success: boolean; message: string }> {
  return apiFetch(`/community/${communityId}/join`, { method: 'POST', body: JSON.stringify({}) });
}

export async function leaveCommunity(communityId: string): Promise<{ success: boolean; message: string }> {
  return apiFetch(`/community/${communityId}/leave`, { method: 'POST', body: JSON.stringify({}) });
}

// Recommendation functions
export async function markRecommendationAsCompleted(recommendationId: string): Promise<{ success: boolean; message: string }> {
  return apiFetch(`/recommendations/${recommendationId}/complete`, { method: 'POST', body: JSON.stringify({}) });
}

export async function dismissRecommendation(recommendationId: string): Promise<{ success: boolean; message: string }> {
  return apiFetch(`/recommendations/${recommendationId}/dismiss`, { method: 'POST', body: JSON.stringify({}) });
}
