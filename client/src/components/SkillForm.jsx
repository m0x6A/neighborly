import { useState } from 'react';
import { api } from '../api/client';

const CATEGORIES = ['general', 'programming', 'music', 'cooking', 'language', 'wellness', 'crafts', 'sports', 'art', 'other'];

export default function SkillForm({ onSaved, onCancel, existing }) {
  const [form, setForm] = useState({
    title: existing?.title || '',
    description: existing?.description || '',
    category: existing?.category || 'general',
    type: existing?.type || 'offer',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const saved = existing
        ? await api.updateSkill(existing.id, form)
        : await api.createSkill(form);
      onSaved(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="form-group">
        <label>Title *</label>
        <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Python tutoring" required />
      </div>
      <div className="form-group">
        <label>Description</label>
        <textarea rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Tell people what you can teach or want to learn..." />
      </div>
      <div className="form-group">
        <label>Category</label>
        <select value={form.category} onChange={e => set('category', e.target.value)}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label>Type *</label>
        <select value={form.type} onChange={e => set('type', e.target.value)}>
          <option value="offer">🎓 I can teach / offer this</option>
          <option value="want">🙋 I want to learn this</option>
        </select>
      </div>
      {error && <p className="error-msg">{error}</p>}
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving…' : existing ? 'Update skill' : 'Add skill'}
        </button>
        {onCancel && <button type="button" className="btn btn-outline" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}
