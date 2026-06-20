async function testWandbox() {
  try {
    const res = await fetch('https://wandbox.org/api/list.json');
    const data = await res.json();
    console.log(data.filter(c => c.language === 'Python' || c.language === 'JavaScript' || c.language === 'C++').map(c => c.name).slice(0, 10));
  } catch (e) {
    console.log(e.message);
  }
}

async function testJudge0() {
  try {
    const res = await fetch('https://ce.judge0.com/submissions?base64_encoded=false&wait=true', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source_code: "print('hello')",
        language_id: 71 // Python 3
      })
    });
    console.log(res.status, await res.text());
  } catch(e) {
    console.log(e.message);
  }
}

async function main() {
  await testWandbox();
  await testJudge0();
}

main();
