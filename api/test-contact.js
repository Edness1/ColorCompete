// Quick test for contact form endpoint
const axios = require('axios');

async function testContactForm() {
  try {
    console.log('Testing contact form endpoint...');
    
    const response = await axios.post('http://localhost:3000/api/email/contact', {
      name: 'Test User',
      email: 'test@example.com',
      subject: 'Test Contact Form',
      message: 'This is a test message from the contact form.'
    }, {
      timeout: 10000
    });
    
    console.log('✅ Success! Response:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('❌ API Error:', error.response.status, error.response.data);
    } else {
      console.log('❌ Connection Error:', error.message);
    }
  }
}

testContactForm();