import http from 'http';
import app from '../server.js';

// Simple lightweight fetch helper against the Express app
function makeRequest(server, path, options = {}) {
  const { port } = server.address();
  const url = `http://localhost:${port}${path}`;

  return new Promise((resolve, reject) => {
    const req = http.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (e) { json = data; }
        resolve({ status: res.statusCode, data: json });
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- Testing Boondocks API Endpoints ---');

  // Bind to dynamic ephemeral port
  const testServer = http.createServer(app);
  await new Promise((resolve) => testServer.listen(0, resolve));
  const port = testServer.address().port;
  console.log(`Test server running on port ${port}`);

  try {
    // 1. Health check
    const health = await makeRequest(testServer, '/api/health');
    console.log(`[PASS] GET /api/health -> Status ${health.status}:`, health.data);
    if (health.status !== 200 || health.data.status !== 'ok') {
      throw new Error('Health check failed');
    }

    // 2. Auth: 400 for empty signup body
    const badSignup = await makeRequest(testServer, '/api/auth/signup', {
      method: 'POST',
      body: {},
    });
    console.log(`[PASS] POST /api/auth/signup (validation) -> Status ${badSignup.status}:`, badSignup.data);
    if (badSignup.status !== 400) {
      throw new Error('Expected 400 Bad Request for empty signup');
    }

    // 3. Auth: 400 for short password
    const shortPass = await makeRequest(testServer, '/api/auth/signup', {
      method: 'POST',
      body: { name: 'Test', email: 'test@example.com', password: '123' },
    });
    console.log(`[PASS] POST /api/auth/signup (password length) -> Status ${shortPass.status}:`, shortPass.data);
    if (shortPass.status !== 400) {
      throw new Error('Expected 400 for short password');
    }

    // 4. Protected route without token
    const unauthMatches = await makeRequest(testServer, '/api/matches');
    console.log(`[PASS] GET /api/matches (unauthorized) -> Status ${unauthMatches.status}:`, unauthMatches.data);
    if (unauthMatches.status !== 401) {
      throw new Error('Expected 401 Unauthorized for /api/matches without token');
    }

    // 5. Protected profile without token
    const unauthProfile = await makeRequest(testServer, '/api/user/profile');
    console.log(`[PASS] GET /api/user/profile (unauthorized) -> Status ${unauthProfile.status}:`, unauthProfile.data);
    if (unauthProfile.status !== 401) {
      throw new Error('Expected 401 Unauthorized for /api/user/profile without token');
    }

    // 6. Undefined API route
    const notFound = await makeRequest(testServer, '/api/undefined-endpoint');
    console.log(`[PASS] GET /api/undefined-endpoint -> Status ${notFound.status}:`, notFound.data);
    if (notFound.status !== 404) {
      throw new Error('Expected 404 for undefined API route');
    }

    console.log('\n🎉 All API Route Structure & Middleware Tests Passed Successfully!');
  } finally {
    testServer.close();
  }
}

runTests().then(() => process.exit(0)).catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

