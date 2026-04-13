const fetch = require('node-fetch');

async function testRoute() {
  const url = 'http://localhost:5002/api/projects';
  try {
    const res = await fetch(url);
    console.log(`Status: ${res.status}`);
    const data = await res.json();
    console.log('Body:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}

testRoute();
