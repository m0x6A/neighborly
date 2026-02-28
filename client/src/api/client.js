const BASE = '/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  // Auth
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  // Skills
  getSkills: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/skills${qs ? '?' + qs : ''}`);
  },
  getSkill: (id) => request(`/skills/${id}`),
  createSkill: (body) => request('/skills', { method: 'POST', body: JSON.stringify(body) }),
  updateSkill: (id, body) => request(`/skills/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteSkill: (id) => request(`/skills/${id}`, { method: 'DELETE' }),

  // Exchanges
  getExchanges: () => request('/exchanges'),
  createExchange: (body) => request('/exchanges', { method: 'POST', body: JSON.stringify(body) }),
  updateExchangeStatus: (id, status) =>
    request(`/exchanges/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // Users
  getMe: () => request('/users/me'),
  updateMe: (body) => request('/users/me', { method: 'PUT', body: JSON.stringify(body) }),
  getUserSkills: (id) => request(`/users/${id}/skills`),
};
