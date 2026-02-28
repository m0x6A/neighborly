const request = require('supertest');
const path = require('path');
const fs = require('fs');

// Use an in-memory test database
process.env.DB_PATH = path.join('/tmp', `test-neighborly-${Date.now()}.db`);

const { createApp } = require('../app');
const { closeDb } = require('../db');

const app = createApp();

let token1, token2, userId1, userId2;

afterAll(() => {
  closeDb();
  try { fs.unlinkSync(process.env.DB_PATH); } catch {}
});

describe('Health check', () => {
  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('Auth', () => {
  it('registers a new user', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'secret1',
      city: 'Portland',
      latitude: 45.52,
      longitude: -122.67,
    });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('alice@example.com');
    expect(res.body.user.password_hash).toBeUndefined();
    token1 = res.body.token;
    userId1 = res.body.user.id;
  });

  it('registers a second user', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Bob',
      email: 'bob@example.com',
      password: 'secret2',
      city: 'Portland',
      latitude: 45.53,
      longitude: -122.68,
    });
    expect(res.status).toBe(201);
    token2 = res.body.token;
    userId2 = res.body.user.id;
  });

  it('rejects duplicate email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Alice2',
      email: 'alice@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(409);
  });

  it('rejects short password', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Charlie',
      email: 'charlie@example.com',
      password: '123',
    });
    expect(res.status).toBe(400);
  });

  it('logs in with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'alice@example.com',
      password: 'secret1',
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.password_hash).toBeUndefined();
  });

  it('rejects wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'alice@example.com',
      password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
  });
});

describe('Skills', () => {
  let skill1Id, skill2Id;

  it('creates an offered skill', async () => {
    const res = await request(app)
      .post('/api/skills')
      .set('Authorization', `Bearer ${token1}`)
      .send({ title: 'Python tutoring', description: 'Teach Python basics', category: 'programming', type: 'offer' });
    expect(res.status).toBe(201);
    expect(res.body.type).toBe('offer');
    skill1Id = res.body.id;
  });

  it('creates a wanted skill', async () => {
    const res = await request(app)
      .post('/api/skills')
      .set('Authorization', `Bearer ${token2}`)
      .send({ title: 'Guitar lessons', description: 'Want to learn guitar', category: 'music', type: 'want' });
    expect(res.status).toBe(201);
    expect(res.body.type).toBe('want');
    skill2Id = res.body.id;
  });

  it('lists all skills', async () => {
    const res = await request(app).get('/api/skills');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  it('filters by type=offer', async () => {
    const res = await request(app).get('/api/skills?type=offer');
    expect(res.status).toBe(200);
    res.body.forEach(s => expect(s.type).toBe('offer'));
  });

  it('filters by search keyword', async () => {
    const res = await request(app).get('/api/skills?search=Python');
    expect(res.status).toBe(200);
    expect(res.body.some(s => s.title.includes('Python'))).toBe(true);
  });

  it('filters by proximity', async () => {
    // Both users are ~1km apart - should appear within 10km
    const res = await request(app).get('/api/skills?lat=45.52&lng=-122.67&radius=10');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('gets a skill by id', async () => {
    const res = await request(app).get(`/api/skills/${skill1Id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(skill1Id);
  });

  it('returns 404 for unknown skill', async () => {
    const res = await request(app).get('/api/skills/99999');
    expect(res.status).toBe(404);
  });

  it('updates own skill', async () => {
    const res = await request(app)
      .put(`/api/skills/${skill1Id}`)
      .set('Authorization', `Bearer ${token1}`)
      .send({ title: 'Advanced Python tutoring' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Advanced Python tutoring');
  });

  it('cannot update another user skill', async () => {
    const res = await request(app)
      .put(`/api/skills/${skill1Id}`)
      .set('Authorization', `Bearer ${token2}`)
      .send({ title: 'Hacked' });
    expect(res.status).toBe(403);
  });

  it('requires auth to create skill', async () => {
    const res = await request(app)
      .post('/api/skills')
      .send({ title: 'No auth skill', type: 'offer' });
    expect(res.status).toBe(401);
  });
});

describe('Exchanges', () => {
  let exchangeId;
  let offerSkillId;

  beforeAll(async () => {
    // Bob creates an offered skill that Alice can request
    const res = await request(app)
      .post('/api/skills')
      .set('Authorization', `Bearer ${token2}`)
      .send({ title: 'Cooking class', type: 'offer', category: 'cooking' });
    offerSkillId = res.body.id;
  });

  it('creates an exchange request', async () => {
    const res = await request(app)
      .post('/api/exchanges')
      .set('Authorization', `Bearer ${token1}`)
      .send({ skill_id: offerSkillId, message: 'I would love to learn cooking!' });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('pending');
    exchangeId = res.body.id;
  });

  it('prevents requesting own skill', async () => {
    // Bob tries to request his own skill
    const res = await request(app)
      .post('/api/exchanges')
      .set('Authorization', `Bearer ${token2}`)
      .send({ skill_id: offerSkillId });
    expect(res.status).toBe(400);
  });

  it('prevents duplicate pending request', async () => {
    const res = await request(app)
      .post('/api/exchanges')
      .set('Authorization', `Bearer ${token1}`)
      .send({ skill_id: offerSkillId });
    expect(res.status).toBe(409);
  });

  it('lists my exchanges', async () => {
    const res = await request(app)
      .get('/api/exchanges')
      .set('Authorization', `Bearer ${token1}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('provider can accept exchange', async () => {
    const res = await request(app)
      .patch(`/api/exchanges/${exchangeId}/status`)
      .set('Authorization', `Bearer ${token2}`)
      .send({ status: 'accepted' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('accepted');
  });

  it('requester cannot accept exchange', async () => {
    // Create a fresh exchange first
    const skillRes = await request(app)
      .post('/api/skills')
      .set('Authorization', `Bearer ${token2}`)
      .send({ title: 'Yoga class', type: 'offer', category: 'wellness' });
    const exRes = await request(app)
      .post('/api/exchanges')
      .set('Authorization', `Bearer ${token1}`)
      .send({ skill_id: skillRes.body.id });
    const res = await request(app)
      .patch(`/api/exchanges/${exRes.body.id}/status`)
      .set('Authorization', `Bearer ${token1}`)
      .send({ status: 'accepted' });
    expect(res.status).toBe(403);
  });

  it('either party can mark completed', async () => {
    const res = await request(app)
      .patch(`/api/exchanges/${exchangeId}/status`)
      .set('Authorization', `Bearer ${token1}`)
      .send({ status: 'completed' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('completed');
  });

  it('requires auth to view exchanges', async () => {
    const res = await request(app).get('/api/exchanges');
    expect(res.status).toBe(401);
  });
});

describe('Users', () => {
  it('gets my profile', async () => {
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${token1}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('alice@example.com');
    expect(res.body.password_hash).toBeUndefined();
  });

  it('updates my profile', async () => {
    const res = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${token1}`)
      .send({ bio: 'I love teaching Python', city: 'Portland' });
    expect(res.status).toBe(200);
    expect(res.body.bio).toBe('I love teaching Python');
  });

  it("gets a user's skills", async () => {
    const res = await request(app).get(`/api/users/${userId1}/skills`);
    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(Array.isArray(res.body.skills)).toBe(true);
  });

  it('returns 404 for unknown user skills', async () => {
    const res = await request(app).get('/api/users/99999/skills');
    expect(res.status).toBe(404);
  });
});
