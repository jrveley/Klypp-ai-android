// src/services/api.ts
// All API calls to the Klypp.ai Netlify backend

const BASE_URL = 'https://klypp.ai/.netlify/functions';

export async function apiCall(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null
) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}/${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok && res.status === 401) {
    throw new Error('UNAUTHORIZED');
  }

  const data = await res.json();
  return { data, status: res.status, ok: res.ok };
}

// ── Auth ──────────────────────────────────────────────────
export const authLogin = (email: string, password: string) =>
  apiCall('auth-login', { method: 'POST', body: JSON.stringify({ email, password }) });

export const authSignup = (email: string, password: string, name: string) =>
  apiCall('auth-signup', { method: 'POST', body: JSON.stringify({ email, password, name }) });

export const authMe = (token: string) =>
  apiCall('auth-me', {}, token);

export const authForgot = (email: string) =>
  apiCall('auth-forgot', { method: 'POST', body: JSON.stringify({ email }) });

// ── Topics ────────────────────────────────────────────────
export const getTopics = (category: string, token: string) =>
  apiCall(`topics-get?category=${category}`, {}, token);

// ── Generate ──────────────────────────────────────────────
export const generateCarousel = (
  payload: {
    model: string;
    max_tokens: number;
    system: string;
    messages: Array<{ role: string; content: string }>;
  },
  token: string
) => apiCall('generate-proxy', { method: 'POST', body: JSON.stringify(payload) }, token);

// ── Image generation ──────────────────────────────────────
export const generateImage = (prompt: string, style: string, token: string) =>
  apiCall('generate-image', {
    method: 'POST',
    body: JSON.stringify({ prompt, style }),
  }, token);

// ── Save / get history ────────────────────────────────────
export const saveCarousel = (data: any, token: string) =>
  apiCall('save-carousel', { method: 'POST', body: JSON.stringify(data) }, token);

export const getCarouselHistory = (token: string) =>
  apiCall('get-carousel-history', {}, token);

// ── Post to Instagram ─────────────────────────────────────
export const postToInstagram = (slides: any[], caption: string, token: string) =>
  apiCall('post-instagram', {
    method: 'POST',
    body: JSON.stringify({ slides, caption }),
  }, token);

// ── Update user ───────────────────────────────────────────
export const updateUser = (data: any, token: string) =>
  apiCall('update-user', { method: 'POST', body: JSON.stringify(data) }, token);
