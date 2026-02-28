const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const skillsRoutes = require('./routes/skills');
const exchangesRoutes = require('./routes/exchanges');
const usersRoutes = require('./routes/users');

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  app.use('/api/auth', authRoutes);
  app.use('/api/skills', skillsRoutes);
  app.use('/api/exchanges', exchangesRoutes);
  app.use('/api/users', usersRoutes);

  // Generic error handler
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

module.exports = { createApp };
