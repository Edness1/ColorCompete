// Use built-in fetch for Node 18+
// const fetch = require('node-fetch');

async function testAPI() {
  try {
    console.log('Testing basic users endpoint...');
    let response = await fetch('http://localhost:3000/api/users');
    console.log('Users endpoint status:', response.status);
    
    if (response.ok) {
      const users = await response.json();
      console.log('Users count:', users.length);
      console.log('Sample user:', users[0]);
    }

    console.log('\nTesting subscriber stats endpoint...');
    response = await fetch('http://localhost:3000/api/users/admin/subscriber-stats');
    console.log('Subscriber stats status:', response.status);
    
    if (response.ok) {
      const stats = await response.json();
      console.log('Stats:', stats);
    } else {
      const error = await response.text();
      console.log('Error:', error);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testAPI();