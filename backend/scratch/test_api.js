const axios = require('axios'); // We might not have axios, let's use fetch since Node 18+ has it.

async function testApi(url, body) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    console.log(`\n--- Testing ${url} ---`);
    console.log(`Status: ${res.status}`);
    const data = await res.text();
    console.log(`Response: ${data.substring(0, 200)}...`);
  } catch (err) {
    console.log(`\n--- Testing ${url} ---`);
    console.log(`Error: ${err.message}`);
  }
}

const pistonBody = {
  language: 'python',
  version: '3.10.0',
  files: [{ content: 'print("hello")' }]
};

async function main() {
  // Piston alternatives
  await testApi('https://emkc.org/api/v2/piston/execute', pistonBody);
  await testApi('https://piston.codes/api/v2/execute', pistonBody);
  
  // Wandbox
  await testApi('https://wandbox.org/api/compile.json', {
    code: 'print("hello")',
    compiler: 'cpython-3.10.0'
  });
}

main();
