// src/lib/api.ts
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

async function request(path: string, options: RequestInit) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message = (data && data.error) || `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  return data;
}

export const authApi = {
  register: (body: {
    fullName: string;
    email: string;
    phone: string;
    clinic: string;
    password: string;
  }) =>
    request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  login: (body: { email: string; password: string }) =>
    request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};