const { test, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const mongoose = require('mongoose');
const app = require('../index');
const User = require('../MODELS/User');
const List = require('../MODELS/List');
const StudyTask = require('../MODELS/StudyTask');
const StudentProgress = require('../MODELS/StudentProgress');

let server;
let baseUrl;

before(async () => {
  // Connect to local test database if not already connected
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/Study_Buddy');
  }

  // Start HTTP server on random port
  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`Test server running at ${baseUrl}`);
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
});

test('Public Landing Page renders successfully (HTTP 200)', async () => {
  const res = await fetch(`${baseUrl}/`);
  assert.strictEqual(res.status, 200);
  const text = await res.text();
  assert.match(text, /StudyBuddy/);
  assert.match(text, /Your Entire Academic World/);
  assert.match(text, /CSE/);
});

test('Login page renders successfully with demo account helpers', async () => {
  const res = await fetch(`${baseUrl}/login`);
  assert.strictEqual(res.status, 200);
  const text = await res.text();
  assert.match(text, /student@studybuddy\.edu/);
  assert.match(text, /Demo Student/);
});

test('Protected routes redirect unauthenticated users to /login', async () => {
  const res = await fetch(`${baseUrl}/home`, { redirect: 'manual' });
  assert.strictEqual(res.status, 302);
  assert.strictEqual(res.headers.get('location'), '/login');
});

test('404 handler returns status 404 for non-existent routes', async () => {
  const res = await fetch(`${baseUrl}/non-existent-random-route-xyz`);
  assert.strictEqual(res.status, 404);
  const text = await res.text();
  assert.match(text, /404/);
});

test('Academic Resources collection contains seeded items', async () => {
  const count = await List.countDocuments();
  assert.ok(count >= 1000, `Expected at least 1000 academic resources, found ${count}`);
});

test('Authentication: Demo Student can login and receives session cookie', async () => {
  const loginRes = await fetch(`${baseUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'userEmail=student@studybuddy.edu&userPassword=Student@123',
    redirect: 'manual'
  });

  assert.strictEqual(loginRes.status, 302);
  assert.strictEqual(loginRes.headers.get('location'), '/home');
  const setCookie = loginRes.headers.get('set-cookie');
  assert.ok(setCookie, 'Expected session cookie in response');
});

test('Authentication: Rejects invalid password', async () => {
  const loginRes = await fetch(`${baseUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'userEmail=student@studybuddy.edu&userPassword=WrongPassword!',
    redirect: 'manual'
  });

  assert.strictEqual(loginRes.status, 200);
  const text = await loginRes.text();
  assert.match(text, /Invalid email or password/);
});

test('Student Flow: Login session accesses /home and /resources', async () => {
  // Login first to get cookie
  const loginRes = await fetch(`${baseUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'userEmail=student@studybuddy.edu&userPassword=Student@123',
    redirect: 'manual'
  });
  const cookie = loginRes.headers.get('set-cookie');

  // Access Dashboard with cookie
  const homeRes = await fetch(`${baseUrl}/home`, {
    headers: { Cookie: cookie }
  });
  assert.strictEqual(homeRes.status, 200);
  const homeText = await homeRes.text();
  assert.match(homeText, /Welcome back/);

  // Access Resources with cookie
  const resRes = await fetch(`${baseUrl}/resources?branch=CSE`, {
    headers: { Cookie: cookie }
  });
  assert.strictEqual(resRes.status, 200);
  const resText = await resRes.text();
  assert.match(resText, /Academic Resource Explorer/);
  assert.match(resText, /CSE/);
});

test('Security: Student role is forbidden from accessing /admin', async () => {
  const loginRes = await fetch(`${baseUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'userEmail=student@studybuddy.edu&userPassword=Student@123',
    redirect: 'manual'
  });
  const cookie = loginRes.headers.get('set-cookie');

  const adminRes = await fetch(`${baseUrl}/admin`, {
    headers: { Cookie: cookie }
  });
  assert.strictEqual(adminRes.status, 403);
});

test('Admin Flow: Demo Admin can access /admin portal', async () => {
  const loginRes = await fetch(`${baseUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'userEmail=admin@studybuddy.edu&userPassword=Admin@123',
    redirect: 'manual'
  });
  const cookie = loginRes.headers.get('set-cookie');

  const adminRes = await fetch(`${baseUrl}/admin`, {
    headers: { Cookie: cookie }
  });
  assert.strictEqual(adminRes.status, 200);
  const text = await adminRes.text();
  assert.match(text, /Administration Portal/);
  assert.match(text, /Bulk Academic Data Import/);
});
