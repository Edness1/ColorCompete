require('dotenv').config();
const tremendousService = require('../services/tremendousService');

async function testTremendousService() {
  console.log('Testing Tremendous Service...');
  
  // Test account balance
  console.log('\n1. Checking account balance...');
  const balanceResult = await tremendousService.getAccountBalance();
  if (balanceResult.success) {
    console.log('✅ Account balance check successful');
    console.log('Available funding sources:', balanceResult.fundingSources?.length || 0);
  } else {
    console.log('❌ Account balance check failed:', balanceResult.error);
  }
  
  // Test products/campaigns
  console.log('\n2. Checking available campaigns...');
  const productsResult = await tremendousService.getProducts();
  if (productsResult.success) {
    console.log('✅ Campaigns check successful');
    console.log('Available campaigns:', productsResult.campaigns?.length || 0);
  } else {
    console.log('❌ Campaigns check failed:', productsResult.error);
  }
  
  // Test gift card sending (commented out to avoid actually sending)
  /*
  console.log('\n3. Testing gift card sending...');
  const giftCardResult = await tremendousService.sendGiftCard({
    recipientEmail: 'test@example.com',
    recipientName: 'Test User',
    amount: 25,
    message: 'Test gift card from ColorCompete monthly drawing system'
  });
  
  if (giftCardResult.success) {
    console.log('✅ Gift card sent successfully');
    console.log('Order ID:', giftCardResult.orderId);
    console.log('Gift Card ID:', giftCardResult.giftCardId);
  } else {
    console.log('❌ Gift card sending failed:', giftCardResult.error);
  }
  */
  
  console.log('\nTest completed!');
}

testTremendousService().catch(console.error);
