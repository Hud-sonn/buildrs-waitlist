// Minimal API client for the standalone waitlist app.
// Talks to the main codex-backend over HTTP — configured via
// NEXT_PUBLIC_WAITLIST_API_URL (see .env.example).

export const WAITLIST_API_URL = (
  process.env.NEXT_PUBLIC_WAITLIST_API_URL || 'https://codex-backend-7utu.onrender.com'
).replace(/\/$/, '');

export async function waitlistFetch(path, options = {}) {
  const res = await fetch(`${WAITLIST_API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.message || data.error || 'Request failed');
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

export const getRecentJoiners = (limit = 5) =>
  waitlistFetch(`/api/waitlist/recent?limit=${limit}`);

export const joinWaitlist = (email, source = 'waitlist-page') =>
  waitlistFetch('/api/waitlist', {
    method: 'POST',
    body: JSON.stringify({ email, source }),
  });
