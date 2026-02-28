import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../components/AuthContext';
import SkillForm from '../components/SkillForm';

export default function Dashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('skills');
  const [skills, setSkills] = useState([]);
  const [exchanges, setExchanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    Promise.all([
      api.getUserSkills(user.id).then(d => setSkills(d.skills)),
      api.getExchanges().then(setExchanges),
    ]).finally(() => setLoading(false));
  }, [user.id]);

  function onSkillSaved(skill) {
    if (editingSkill) {
      setSkills(s => s.map(sk => sk.id === skill.id ? skill : sk));
    } else {
      setSkills(s => [skill, ...s]);
    }
    setShowForm(false);
    setEditingSkill(null);
    setFeedback('Skill saved!');
    setTimeout(() => setFeedback(''), 3000);
  }

  async function deleteSkill(id) {
    if (!confirm('Delete this skill?')) return;
    try {
      await api.deleteSkill(id);
      setSkills(s => s.filter(sk => sk.id !== id));
    } catch (err) {
      alert(err.message);
    }
  }

  async function updateStatus(id, status) {
    try {
      const updated = await api.updateExchangeStatus(id, status);
      setExchanges(e => e.map(ex => ex.id === id ? updated : ex));
    } catch (err) {
      alert(err.message);
    }
  }

  const myExchanges = exchanges.filter(e => e.requester_id === user.id);
  const incomingExchanges = exchanges.filter(e => e.provider_id === user.id);

  if (loading) return <div className="loading">Loading…</div>;

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>📋 My Dashboard</h2>
        <Link to="/profile" className="btn btn-outline btn-sm">✏️ Edit Profile</Link>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'skills' ? 'active' : ''}`} onClick={() => setTab('skills')}>
          🎓 My Skills ({skills.length})
        </button>
        <button className={`tab ${tab === 'sent' ? 'active' : ''}`} onClick={() => setTab('sent')}>
          📤 Sent Requests ({myExchanges.length})
        </button>
        <button className={`tab ${tab === 'received' ? 'active' : ''}`} onClick={() => setTab('received')}>
          📥 Incoming ({incomingExchanges.length})
        </button>
      </div>

      {feedback && <p className="success-msg" style={{ marginBottom: 12 }}>{feedback}</p>}

      {tab === 'skills' && (
        <>
          {!showForm && !editingSkill && (
            <button className="btn btn-primary" style={{ marginBottom: 16 }} onClick={() => setShowForm(true)}>
              + Add skill
            </button>
          )}
          {(showForm || editingSkill) && (
            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ marginBottom: 14 }}>{editingSkill ? 'Edit Skill' : 'New Skill'}</h3>
              <SkillForm
                existing={editingSkill}
                onSaved={onSkillSaved}
                onCancel={() => { setShowForm(false); setEditingSkill(null); }}
              />
            </div>
          )}
          {skills.length === 0 ? (
            <div className="empty">
              <div className="icon">🎓</div>
              <p>You haven&apos;t added any skills yet.<br />Share what you can teach, or what you want to learn!</p>
            </div>
          ) : (
            <div className="card-grid">
              {skills.map(skill => (
                <div key={skill.id} className="card skill-card">
                  <span className={`badge badge-${skill.type}`}>{skill.type === 'offer' ? '🎓 Offering' : '🙋 Wanted'}</span>
                  <h3>{skill.title}</h3>
                  {skill.description && <p className="desc">{skill.description}</p>}
                  <p className="meta">{skill.category}</p>
                  <div className="actions">
                    <button className="btn btn-outline btn-sm" onClick={() => { setEditingSkill(skill); setShowForm(false); }}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteSkill(skill.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'sent' && (
        <>
          {myExchanges.length === 0 ? (
            <div className="empty">
              <div className="icon">📤</div>
              <p>You haven&apos;t sent any skill requests yet.<br /><Link to="/browse">Browse skills</Link> to get started!</p>
            </div>
          ) : (
            <div className="card">
              {myExchanges.map(ex => (
                <div key={ex.id} className="exchange-item">
                  <div className="exchange-row">
                    <span className={`badge badge-${ex.status}`}>{ex.status}</span>
                    <strong>{ex.skill_title}</strong>
                    <span style={{ color: 'var(--muted)', fontSize: '.85rem' }}>from {ex.provider_name}</span>
                  </div>
                  {ex.message && <p style={{ fontSize: '.85rem', color: '#555' }}>"{ex.message}"</p>}
                  {ex.status === 'accepted' && (
                    <button className="btn btn-primary btn-sm" onClick={() => updateStatus(ex.id, 'completed')}>
                      ✅ Mark completed
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'received' && (
        <>
          {incomingExchanges.length === 0 ? (
            <div className="empty">
              <div className="icon">📥</div>
              <p>No incoming requests yet. Add skills you can offer to get requests!</p>
            </div>
          ) : (
            <div className="card">
              {incomingExchanges.map(ex => (
                <div key={ex.id} className="exchange-item">
                  <div className="exchange-row">
                    <span className={`badge badge-${ex.status}`}>{ex.status}</span>
                    <strong>{ex.skill_title}</strong>
                    <span style={{ color: 'var(--muted)', fontSize: '.85rem' }}>from {ex.requester_name}</span>
                  </div>
                  {ex.message && <p style={{ fontSize: '.85rem', color: '#555' }}>"{ex.message}"</p>}
                  {ex.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-primary btn-sm" onClick={() => updateStatus(ex.id, 'accepted')}>✅ Accept</button>
                      <button className="btn btn-danger btn-sm" onClick={() => updateStatus(ex.id, 'declined')}>❌ Decline</button>
                    </div>
                  )}
                  {ex.status === 'accepted' && (
                    <button className="btn btn-primary btn-sm" onClick={() => updateStatus(ex.id, 'completed')}>
                      ✅ Mark completed
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
