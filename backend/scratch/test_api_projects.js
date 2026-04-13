const axios = require('axios');

async function testFetch() {
  const url = 'http://localhost:5002/api/projects';
  try {
    console.log(`Calling ${url}...`);
    const res = await axios.get(url);
    console.log(`Status: ${res.status}`);
    console.log('Success:', res.data.success);
    console.log('Count:', res.data.count);
    console.log('Projects Length:', res.data.projects?.length);
    if (res.data.projects?.length > 0) {
      console.log('First project title:', res.data.projects[0].projectTitle);
      console.log('First project studentId:', res.data.projects[0].studentId);
    }
  } catch (err) {
    if (err.response) {
      console.error(`Error ${err.response.status}:`, err.response.data);
    } else {
      console.error('Error:', err.message);
    }
  }
}

testFetch();
