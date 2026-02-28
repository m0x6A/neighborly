const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../db');
const { signToken } = require('../auth');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, bio, city, latitude, longitude } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email, and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'Email already in use' });
  }

  const hash = await bcrypt.hash(password, 10);
  const result = db.prepare(
    'INSERT INTO users (name, email, password_hash, bio, city, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(name, email, hash, bio || '', city || '', latitude ?? null, longitude ?? null);

  const token = signToken({ id: result.lastInsertRowid, email });
  const user = db.prepare('SELECT id, name, email, bio, city, latitude, longitude, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
  return res.status(201).json({ token, user });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = signToken({ id: user.id, email: user.email });
  const { password_hash, ...safeUser } = user;
  return res.json({ token, user: safeUser });
});

module.exports = router;
