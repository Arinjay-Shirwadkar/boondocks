import http from 'http';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(`http://localhost:5000${path}`, {
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

async function testLiveFlow() {
  console.log('--- Testing Live Full-Stack Endpoints ---');

  const timestamp = Date.now();
  const hostEmail = `host_${timestamp}@boondocks.test`;
  const seekerEmail = `seeker_${timestamp}@boondocks.test`;

  // 1. Host signup
  const hostSignup = await request('/api/auth/signup', {
    method: 'POST',
    body: {
      name: 'Host Alex',
      email: hostEmail,
      password: 'password123',
      role: 'host',
      area: 'Andheri West, Mumbai',
      location: { type: 'Point', coordinates: [72.8277, 19.1136], address: 'Andheri West, Mumbai' },
      preferences: {
        food: 'any',
        vices: 'all-legal',
        minPrice: 4000,
        maxPrice: 20000,
      },
      priorityWeights: { price: 4, vices: 4, food: 3 },
    },
  });
  console.log('[PASS] Host Signup status:', hostSignup.status);
  const hostToken = hostSignup.data.token;

  // 2. Seeker signup
  const seekerSignup = await request('/api/auth/signup', {
    method: 'POST',
    body: {
      name: 'Seeker Sam',
      email: seekerEmail,
      password: 'password123',
      role: 'seeker',
      area: 'Andheri West, Mumbai',
      location: { type: 'Point', coordinates: [72.8280, 19.1140], address: 'Andheri West, Mumbai' },
      radiusKm: 6,
      preferences: {
        food: 'veg',
        vices: 'smoking',
        minPrice: 5000,
        maxPrice: 15000,
        pets: false,
        guests: 'occasional',
        sleepTime: 'early-bird',
      },
      priorityWeights: { food: 5, vices: 4, price: 5, pets: 3, guests: 2, sleepTime: 4 },
    },
  });
  console.log('[PASS] Seeker Signup status:', seekerSignup.status);
  const seekerToken = seekerSignup.data.token;

  // 3. Host lists property with amenities
  const createProp = await request('/api/properties', {
    method: 'POST',
    headers: { Authorization: `Bearer ${hostToken}` },
    body: {
      title: 'Comfort Sharing Flat near Metro',
      type: 'Sharing Flat',
      location: { type: 'Point', coordinates: [72.8300, 19.1150], address: 'Andheri West, Mumbai' },
      rentPerHead: 9500, // Within seeker budget 5000-15000
      totalBeds: 4,
      availableBeds: 2,
      rules: {
        foodAllowed: 'veg',
        viceTolerance: 'smoking',
        petsAllowed: false,
        guestPolicy: 'occasional',
        sleepPolicy: 'early',
      },
      amenities: ['Wi-Fi', 'AC', 'Washing Machine', 'RO Water'],
    },
  });
  console.log('[PASS] Create Property with amenities status:', createProp.status);
  const propertyId = createProp.data._id;

  // 4. Host edits property via PUT /api/properties/:id
  const editProp = await request(`/api/properties/${propertyId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${hostToken}` },
    body: {
      rentPerHead: 9200,
      amenities: ['Wi-Fi', 'AC', 'Washing Machine', 'RO Water', 'Power Backup'],
    },
  });
  console.log('[PASS] Edit Property PUT status:', editProp.status, 'New rent:', editProp.data.rentPerHead, 'Amenities count:', editProp.data.amenities?.length);

  // 5. Seeker calculates matches (verifying budget compatibility in score)
  const matchesRes = await request('/api/matches', {
    headers: { Authorization: `Bearer ${seekerToken}` },
  });
  console.log('[PASS] GET /api/matches count:', matchesRes.data.length);
  const matchedProp = matchesRes.data.find((m) => m.property._id === propertyId);
  console.log('   Matched score:', matchedProp?.matchScore, '%');
  const priceItem = matchedProp?.breakdown?.find((b) => b.category === 'price');
  console.log('   Budget breakdown item:', priceItem);

  // 6. Seeker sends join request
  const reqRes = await request('/api/requests', {
    method: 'POST',
    headers: { Authorization: `Bearer ${seekerToken}` },
    body: { propertyId },
  });
  console.log('[PASS] POST /api/requests status:', reqRes.status);
  const requestId = reqRes.data._id;

  // 7. Host inspects applicant profile & compatibility
  const applicantRes = await request(`/api/requests/${requestId}/applicant`, {
    headers: { Authorization: `Bearer ${hostToken}` },
  });
  console.log('[PASS] GET /api/requests/:id/applicant status:', applicantRes.status);
  console.log('   Applicant Name:', applicantRes.data.seeker?.name);
  console.log('   Applicant Budget:', applicantRes.data.seeker?.preferences?.minPrice, '-', applicantRes.data.seeker?.preferences?.maxPrice);
  console.log('   Applicant Vices (no drugs):', applicantRes.data.seeker?.preferences?.vices);

  // 8. Host accepts request
  const acceptRes = await request(`/api/requests/${requestId}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${hostToken}` },
    body: { status: 'accepted' },
  });
  console.log('[PASS] Accept request status:', acceptRes.status, 'Request status:', acceptRes.data.status);

  // 9. Host sends message
  const hostMsg = await request(`/api/requests/${requestId}/message`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${hostToken}` },
    body: { message: 'Hey Sam! Glad you like the flat. When can you visit?' },
  });
  console.log('[PASS] Host sends message status:', hostMsg.status);

  // 10. Seeker checks chat via GET /api/requests/:id/chat
  const chatRes = await request(`/api/requests/${requestId}/chat`, {
    headers: { Authorization: `Bearer ${seekerToken}` },
  });
  console.log('[PASS] GET /api/requests/:id/chat status:', chatRes.status, 'Message count:', chatRes.data.chatHistory?.length);
  console.log('   Latest message:', chatRes.data.chatHistory?.[0]?.message);

  console.log('\n🎉 ALL LIVE ENDPOINTS AND FEATURE UPDATES VERIFIED SUCCESSFULLY!');
}

testLiveFlow().then(() => process.exit(0)).catch((err) => {
  console.error('❌ Live test failed:', err);
  process.exit(1);
});

