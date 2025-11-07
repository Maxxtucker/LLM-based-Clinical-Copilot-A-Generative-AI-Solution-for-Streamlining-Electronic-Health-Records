const API_BASE = process.env.REACT_APP_API_BASE_URL || '';

export async function getMyProfile() {
  const res = await fetch(`${API_BASE}/api/users/me`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) {
    let msg = 'Failed to load profile';
    try { const data = await res.json(); msg = data.error || data.message || msg; } catch {}
    const error = new Error(msg);
    error.status = res.status;
    throw error;
  }
  return res.json();
}

export async function updateMyProfile(payload) {
  const res = await fetch(`${API_BASE}/api/users/me`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let msg = 'Failed to save profile';
    try { const data = await res.json(); msg = data.error || data.message || msg; } catch {}
    const error = new Error(msg);
    error.status = res.status;
    throw error;
  }
  return res.json();
}
