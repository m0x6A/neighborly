const express = require('express');
const { getDb } = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();

// GET /api/exchanges - my exchanges (as requester or provider)
router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const exchanges = db.prepare(`
    SELECT e.*,
      s.title AS skill_title, s.type AS skill_type, s.category,
      r.name AS requester_name, r.email AS requester_email,
      p.name AS provider_name, p.email AS provider_email
    FROM exchanges e
    JOIN skills s ON e.skill_id = s.id
    JOIN users r ON e.requester_id = r.id
    JOIN users p ON e.provider_id = p.id
    WHERE e.requester_id = ? OR e.provider_id = ?
    ORDER BY e.created_at DESC
  `).all(req.user.id, req.user.id);

  return res.json(exchanges);
});

// POST /api/exchanges - request a skill exchange
router.post('/', requireAuth, (req, res) => {
  const { skill_id, message } = req.body;
  if (!skill_id) {
    return res.status(400).json({ error: 'skill_id is required' });
  }

  const db = getDb();
  const skill = db.prepare('SELECT * FROM skills WHERE id = ?').get(skill_id);
  if (!skill) return res.status(404).json({ error: 'Skill not found' });
  if (skill.user_id === req.user.id) {
    return res.status(400).json({ error: 'You cannot request your own skill' });
  }

  // Check for existing pending request
  const existing = db.prepare(
    'SELECT id FROM exchanges WHERE requester_id = ? AND skill_id = ? AND status = ?'
  ).get(req.user.id, skill_id, 'pending');
  if (existing) {
    return res.status(409).json({ error: 'You already have a pending request for this skill' });
  }

  const result = db.prepare(
    'INSERT INTO exchanges (requester_id, provider_id, skill_id, message) VALUES (?, ?, ?, ?)'
  ).run(req.user.id, skill.user_id, skill_id, message || '');

  const exchange = db.prepare('SELECT * FROM exchanges WHERE id = ?').get(result.lastInsertRowid);
  return res.status(201).json(exchange);
});

// PATCH /api/exchanges/:id/status - accept, decline, or complete
router.patch('/:id/status', requireAuth, (req, res) => {
  const { status } = req.body;
  const allowed = ['accepted', 'declined', 'completed'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${allowed.join(', ')}` });
  }

  const db = getDb();
  const exchange = db.prepare('SELECT * FROM exchanges WHERE id = ?').get(req.params.id);
  if (!exchange) return res.status(404).json({ error: 'Exchange not found' });

  // Only the provider can accept/decline; either party can mark complete
  if (status === 'accepted' || status === 'declined') {
    if (exchange.provider_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the skill provider can accept or decline' });
    }
  } else if (status === 'completed') {
    if (exchange.requester_id !== req.user.id && exchange.provider_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
  }

  db.prepare(
    "UPDATE exchanges SET status = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(status, exchange.id);

  const updated = db.prepare('SELECT * FROM exchanges WHERE id = ?').get(exchange.id);
  return res.json(updated);
});

module.exports = router;
