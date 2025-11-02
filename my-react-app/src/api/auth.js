const API_BASE = process.env.REACT_APP_API_BASE_URL || '';

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    let msg = 'Login failed';
    try { const data = await res.json(); msg = data.error || data.message || msg; } catch {}
    const error = new Error(msg);
    error.status = res.status;
    throw error;
  }
  return res.json();
}

export async function me() {
  const res = await fetch(`${API_BASE}/api/auth/me`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) return null;
  return res.json();
}

export async function logout() {
  await fetch(`${API_BASE}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}
