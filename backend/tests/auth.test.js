const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');

let app;
let mongod;

beforeAll(async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.MONGO_URI = uri;
  // connect mongoose
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  // require app after DB is available
  app = require('../app');
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

describe('Auth endpoints', () => {
  const testUser = { name: 'Test User', email: 'test@example.com', password: 'Password123', role: 'student' };
  let token;

  test('register should create user and return token', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser).expect(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toBeDefined();
    token = res.body.token;
  });

  test('me should return current user when authenticated', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`).expect(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(testUser.email);
  });

  test('login should return token for valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: testUser.email, password: testUser.password }).expect(200);
    expect(res.body.token).toBeDefined();
  });

  test('change-password should change password', async () => {
    const res = await request(app).post('/api/auth/change-password').set('Authorization', `Bearer ${token}`).send({ oldPassword: testUser.password, newPassword: 'Newpass123' }).expect(200);
    expect(res.body.msg).toMatch(/Password changed/);
  });

  test('logout should revoke token and subsequent requests fail', async () => {
    // logout the original token
    await request(app).post('/api/auth/logout').set('Authorization', `Bearer ${token}`).expect(200);
    // now token should be revoked
    await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`).expect(401);
  });
});
