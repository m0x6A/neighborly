import { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { api } from '../api/client';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', bio: user?.bio || '', city: user?.city || '' });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const updated = await api.updateMe(form);
      setUser(updated);
      setSuccess('Profile updated!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function useMyLocation() {
    try {
      const pos = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
      );
      await api.updateMe({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      setSuccess('Location updated!');
    } catch {
      setError('Could not get location. Please allow location access.');
    }
  }

  return (
    <div className="page" style={{ maxWidth: 560 }}>
      <div className="profile-header">
        <div className="avatar">{user?.name?.[0]?.toUpperCase()}</div>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{user?.name}</h2>
          <p style={{ color: 'var(--muted)', fontSize: '.9rem' }}>{user?.email}</p>
          {user?.city && <p style={{ color: 'var(--muted)', fontSize: '.9rem' }}>📍 {user.city}</p>}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>Edit Profile</h3>
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} required />
          </div>
          <div className="form-group">
            <label>City</label>
            <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="e.g. Portland, OR" />
          </div>
          <div className="form-group">
            <label>Bio</label>
            <textarea rows={3} value={form.bio} onChange={e => set('bio', e.target.value)} placeholder="Tell neighbors about yourself…" />
          </div>
          {error && <p className="error-msg">{error}</p>}
          {success && <p className="success-msg">{success}</p>}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving…' : 'Save changes'}
            </button>
            <button type="button" className="btn btn-outline" onClick={useMyLocation}>
              📍 Update my location
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
