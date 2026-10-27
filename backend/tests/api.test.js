const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const app = require('../server');

let server;
let baseUrl;

const requestJSON = (method, path, body = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      url,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
        }
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: data ? JSON.parse(data) : null });
          } catch (e) {
            resolve({ status: res.statusCode, data });
          }
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
};

describe('Student Task Tracker REST API (CRUD & Dashboard Stats)', () => {
  before(async () => {
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const { port } = server.address();
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  test('POST /api/tasks/seed resets and populates initial academic tasks', async () => {
    const res = await requestJSON('POST', '/api/tasks/seed');
    assert.strictEqual(res.status, 201);
    assert.ok(Array.isArray(res.data.tasks));
    assert.strictEqual(res.data.tasks.length, 6);
  });

  test('GET /api/tasks retrieves all tasks and supports filtering by priority, status, and subject', async () => {
    const allRes = await requestJSON('GET', '/api/tasks');
    assert.strictEqual(allRes.status, 200);
    assert.strictEqual(allRes.data.length, 6);

    const highRes = await requestJSON('GET', '/api/tasks?priority=High');
    assert.strictEqual(highRes.status, 200);
    assert.ok(highRes.data.every((t) => t.priority === 'High'));

    const statusRes = await requestJSON('GET', '/api/tasks?status=Completed');
    assert.strictEqual(statusRes.status, 200);
    assert.ok(statusRes.data.every((t) => t.status === 'Completed'));
  });

  test('POST /api/tasks creates a new task and validates schema constraints', async () => {
    const invalidRes = await requestJSON('POST', '/api/tasks', {
      title: '',
      subject: 'Operating Systems'
    });
    assert.strictEqual(invalidRes.status, 400);

    const createRes = await requestJSON('POST', '/api/tasks', {
      title: 'Kernel Page Table Lab',
      subject: 'Operating Systems',
      category: 'Lab',
      priority: 'High',
      status: 'Pending',
      deadline: '2026-11-05',
      description: 'Implement copy-on-write fork in xv6.',
      estimatedHours: 5
    });
    assert.strictEqual(createRes.status, 201);
    assert.strictEqual(createRes.data.title, 'Kernel Page Table Lab');
    assert.ok(createRes.data._id);

    const taskId = createRes.data._id;

    // Update task via PUT
    const updateRes = await requestJSON('PUT', `/api/tasks/${taskId}`, {
      status: 'In Progress',
      priority: 'Medium'
    });
    assert.strictEqual(updateRes.status, 200);
    assert.strictEqual(updateRes.data.status, 'In Progress');
    assert.strictEqual(updateRes.data.priority, 'Medium');

    // Quick status update via PATCH
    const patchRes = await requestJSON('PATCH', `/api/tasks/${taskId}/status`, {
      status: 'Completed'
    });
    assert.strictEqual(patchRes.status, 200);
    assert.strictEqual(patchRes.data.status, 'Completed');

    // Delete task via DELETE
    const delRes = await requestJSON('DELETE', `/api/tasks/${taskId}`);
    assert.strictEqual(delRes.status, 200);

    const verifyMissing = await requestJSON('GET', `/api/tasks/${taskId}`);
    assert.strictEqual(verifyMissing.status, 404);
  });

  test('GET /api/tasks/stats returns accurate workload summary and approaching deadlines', async () => {
    const statsRes = await requestJSON('GET', '/api/tasks/stats');
    assert.strictEqual(statsRes.status, 200);
    assert.strictEqual(typeof statsRes.data.total, 'number');
    assert.strictEqual(typeof statsRes.data.completionRate, 'number');
    assert.ok(Array.isArray(statsRes.data.approachingTasks));
    assert.ok(Array.isArray(statsRes.data.subjectBreakdown));
  });
});

