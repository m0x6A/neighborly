const express = require('express');
const { getDb } = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();

// GET /api/users/me
router.get('/me', requireAuth, (req, res) => {
  const db = getDb();
  const user = db.prepare(
    'SELECT id, name, email, bio, city, latitude, longitude, created_at FROM users WHERE id = ?'
  ).get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json(user);
});

// PUT /api/users/me
router.put('/me', requireAuth, (req, res) => {
  const { name, bio, city, latitude, longitude } = req.body;
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  db.prepare(
    'UPDATE users SET name = ?, bio = ?, city = ?, latitude = ?, longitude = ? WHERE id = ?'
  ).run(
    name ?? user.name,
    bio ?? user.bio,
    city ?? user.city,
    latitude ?? user.latitude,
    longitude ?? user.longitude,
    user.id
  );

  const updated = db.prepare(
    'SELECT id, name, email, bio, city, latitude, longitude, created_at FROM users WHERE id = ?'
  ).get(user.id);
  return res.json(updated);
});

// GET /api/users/:id/skills
router.get('/:id/skills', (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id, name, city FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const skills = db.prepare(
    'SELECT * FROM skills WHERE user_id = ? ORDER BY created_at DESC'
  ).all(req.params.id);

  return res.json({ user, skills });
});

module.exports = router;
