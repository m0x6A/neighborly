const express = require('express');
const { getDb } = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();

// Haversine distance in km
function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// GET /api/skills - browse all skills (with optional filters)
router.get('/', (req, res) => {
  const { type, category, search, lat, lng, radius } = req.query;
  const db = getDb();

  let query = `
    SELECT s.*, u.name AS user_name, u.city, u.latitude, u.longitude
    FROM skills s
    JOIN users u ON s.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (type === 'offer' || type === 'want') {
    query += ' AND s.type = ?';
    params.push(type);
  }
  if (category) {
    query += ' AND s.category = ?';
    params.push(category);
  }
  if (search) {
    query += ' AND (s.title LIKE ? OR s.description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY s.created_at DESC';
  let skills = db.prepare(query).all(...params);

  // Filter by distance if coordinates provided
  if (lat && lng) {
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const maxRadius = parseFloat(radius) || 25;
    skills = skills.filter(s => {
      if (s.latitude == null || s.longitude == null) return false;
      return distanceKm(userLat, userLng, s.latitude, s.longitude) <= maxRadius;
    });
  }

  return res.json(skills);
});

// GET /api/skills/:id
router.get('/:id', (req, res) => {
  const db = getDb();
  const skill = db.prepare(`
    SELECT s.*, u.name AS user_name, u.city, u.bio AS user_bio, u.latitude, u.longitude
    FROM skills s JOIN users u ON s.user_id = u.id
    WHERE s.id = ?
  `).get(req.params.id);

  if (!skill) return res.status(404).json({ error: 'Skill not found' });
  return res.json(skill);
});

// POST /api/skills
router.post('/', requireAuth, (req, res) => {
  const { title, description, category, type } = req.body;
  if (!title || !type) {
    return res.status(400).json({ error: 'title and type are required' });
  }
  if (type !== 'offer' && type !== 'want') {
    return res.status(400).json({ error: 'type must be offer or want' });
  }

  const db = getDb();
  const result = db.prepare(
    'INSERT INTO skills (user_id, title, description, category, type) VALUES (?, ?, ?, ?, ?)'
  ).run(req.user.id, title, description || '', category || 'general', type);

  const skill = db.prepare('SELECT * FROM skills WHERE id = ?').get(result.lastInsertRowid);
  return res.status(201).json(skill);
});

// PUT /api/skills/:id
router.put('/:id', requireAuth, (req, res) => {
  const db = getDb();
  const skill = db.prepare('SELECT * FROM skills WHERE id = ?').get(req.params.id);
  if (!skill) return res.status(404).json({ error: 'Skill not found' });
  if (skill.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  const { title, description, category, type } = req.body;
  if (type && type !== 'offer' && type !== 'want') {
    return res.status(400).json({ error: 'type must be offer or want' });
  }

  db.prepare(
    'UPDATE skills SET title = ?, description = ?, category = ?, type = ? WHERE id = ?'
  ).run(
    title ?? skill.title,
    description ?? skill.description,
    category ?? skill.category,
    type ?? skill.type,
    skill.id
  );

  const updated = db.prepare('SELECT * FROM skills WHERE id = ?').get(skill.id);
  return res.json(updated);
});

// DELETE /api/skills/:id
router.delete('/:id', requireAuth, (req, res) => {
  const db = getDb();
  const skill = db.prepare('SELECT * FROM skills WHERE id = ?').get(req.params.id);
  if (!skill) return res.status(404).json({ error: 'Skill not found' });
  if (skill.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  db.prepare('DELETE FROM skills WHERE id = ?').run(skill.id);
  return res.json({ message: 'Skill deleted' });
});

module.exports = router;
