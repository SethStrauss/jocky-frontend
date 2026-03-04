// Module-level store for the current authenticated user.
// Set in App.tsx on auth state change; read by any component that needs the user ID.

export let currentSession: { userId: string; role: 'venue' | 'dj' } | null = null;

export function setCurrentSession(s: { userId: string; role: 'venue' | 'dj' } | null) {
  currentSession = s;
}
