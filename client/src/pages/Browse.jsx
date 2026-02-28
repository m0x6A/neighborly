import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../components/AuthContext';

export default function Browse() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: '', category: '', search: '' });
  const [nearby, setNearby] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [requestingId, setRequestingId] = useState(null);
  const [requestMsg, setRequestMsg] = useState('');
  const [feedback, setFeedback] = useState({});

  useEffect(() => {
    loadSkills();
  }, [filters, nearby, userCoords]);

  async function loadSkills() {
    setLoading(true);
    try {
      const params = {};
      if (filters.type) params.type = filters.type;
      if (filters.category) params.category = filters.category;
      if (filters.search) params.search = filters.search;
      if (nearby && userCoords) {
        params.lat = userCoords.lat;
        params.lng = userCoords.lng;
        params.radius = 25;
      }
      const data = await api.getSkills(params);
      setSkills(data);
    } finally {
      setLoading(false);
    }
  }

  function setFilter(k, v) {
    setFilters(f => ({ ...f, [k]: v }));
  }

  async function enableNearby() {
    if (nearby) { setNearby(false); return; }
    try {
      const pos = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
      );
      setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setNearby(true);
    } catch {
      alert('Location access denied. Please allow location to filter nearby skills.');
    }
  }

  async function requestSkill(skill) {
    if (!user) { navigate('/login'); return; }
    setRequestingId(skill.id);
    setRequestMsg('');
  }

  async function submitRequest(skillId) {
    try {
      await api.createExchange({ skill_id: skillId, message: requestMsg });
      setFeedback(f => ({ ...f, [skillId]: 'success' }));
      setRequestingId(null);
    } catch (err) {
      setFeedback(f => ({ ...f, [skillId]: err.message }));
    }
  }

  const CATEGORIES = ['', 'general', 'programming', 'music', 'cooking', 'language', 'wellness', 'crafts', 'sports', 'art', 'other'];

  return (
    <div className="page">
      <h2 style={{ marginBottom: 16, fontSize: '1.6rem', fontWeight: 800 }}>🔍 Browse Skills</h2>

      <div className="filters">
        <input
          placeholder="Search skills…"
          value={filters.search}
          onChange={e => setFilter('search', e.target.value)}
        />
        <select value={filters.type} onChange={e => setFilter('type', e.target.value)}>
          <option value="">All types</option>
          <option value="offer">🎓 Offering</option>
          <option value="want">🙋 Wanted</option>
        </select>
        <select value={filters.category} onChange={e => setFilter('category', e.target.value)}>
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{c ? c.charAt(0).toUpperCase() + c.slice(1) : 'All categories'}</option>
          ))}
        </select>
        <button
          className={`btn ${nearby ? 'btn-primary' : 'btn-outline'} btn-sm`}
          onClick={enableNearby}
        >
          📍 {nearby ? 'Nearby on' : 'Nearby'}
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading skills…</div>
      ) : skills.length === 0 ? (
        <div className="empty">
          <div className="icon">🌱</div>
          <p>No skills found. Try adjusting your filters!</p>
        </div>
      ) : (
        <div className="card-grid">
          {skills.map(skill => (
            <div key={skill.id} className="card skill-card">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className={`badge badge-${skill.type}`}>{skill.type === 'offer' ? '🎓 Offering' : '🙋 Wanted'}</span>
                <span className="badge" style={{ background: '#f3f4f6', color: '#374151' }}>{skill.category}</span>
              </div>
              <h3>{skill.title}</h3>
              {skill.description && <p className="desc">{skill.description}</p>}
              <div className="meta">
                <span>👤 {skill.user_name}</span>
                {skill.city && <span>📍 {skill.city}</span>}
              </div>

              {feedback[skill.id] === 'success' ? (
                <p className="success-msg">✅ Request sent!</p>
              ) : (
                <>
                  {feedback[skill.id] && <p className="error-msg">{feedback[skill.id]}</p>}
                  {requestingId === skill.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
                      <textarea
                        rows={2}
                        placeholder="Add a message (optional)…"
                        value={requestMsg}
                        onChange={e => setRequestMsg(e.target.value)}
                      />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-primary btn-sm" onClick={() => submitRequest(skill.id)}>Send request</button>
                        <button className="btn btn-outline btn-sm" onClick={() => setRequestingId(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    user?.id !== skill.user_id && skill.type === 'offer' && (
                      <div className="actions">
                        <button className="btn btn-accent btn-sm" onClick={() => requestSkill(skill)}>
                          🤝 Request to learn
                        </button>
                      </div>
                    )
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
