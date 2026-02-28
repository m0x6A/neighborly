import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../components/AuthContext';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', city: '', bio: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Try to get coordinates from browser
    let lat, lng;
    try {
      const pos = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 4000 })
      );
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } catch {}

    try {
      const { token, user } = await api.register({ ...form, latitude: lat, longitude: lng });
      login(token, user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="card">
        <h2>🏘️ Join Neighborly</h2>
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Your name" required />
          </div>
          <div className="form-group">
            <label>Email *</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" required />
          </div>
          <div className="form-group">
            <label>Password *</label>
            <input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="At least 6 characters" required minLength={6} />
          </div>
          <div className="form-group">
            <label>City</label>
            <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="e.g. Portland, OR" />
          </div>
          <div className="form-group">
            <label>Short bio</label>
            <textarea rows={2} value={form.bio} onChange={e => set('bio', e.target.value)} placeholder="Tell neighbors a bit about yourself…" />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p style={{ marginTop: 16, textAlign: 'center', color: 'var(--muted)', fontSize: '.9rem' }}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
