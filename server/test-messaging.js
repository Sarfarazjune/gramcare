/**
 * Test script for SMS and WhatsApp integration
 * Run with: node test-messaging.js
 */

require('dotenv').config();
const axios = require('axios');
const assert = require('assert');

const SMS_WEBHOOK_URL = 'http://localhost:3000/api/sms/webhook';
const WHATSAPP_WEBHOOK_URL = 'http://localhost:3000/api/whatsapp/webhook';

async function testMessagingIntegration() {
  console.log('🚀 Testing GramCare Messaging Integration\n');

  // Test SMS Webhook
  console.log('Testing SMS Webhook...');
  try {
    const smsResponse = await axios.post(SMS_WEBHOOK_URL, 'Body=Hello&From=+1234567890', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    assert.strictEqual(smsResponse.status, 200, 'SMS webhook should return 200 OK');
    assert.ok(smsResponse.data.includes('Hello! I\'m GramCare'), 'SMS response should contain welcome message');
    console.log('✅ SMS Webhook Test Passed');
  } catch (error) {
    console.error('❌ SMS Webhook Test Failed:', error.message);
  }

  console.log('\nTesting WhatsApp Webhook...');
  try {
    const whatsappResponse = await axios.post(WHATSAPP_WEBHOOK_URL, 'Body=Hi&From=whatsapp:+19876543210', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    assert.strictEqual(whatsappResponse.status, 200, 'WhatsApp webhook should return 200 OK');
    assert.ok(whatsappResponse.data.includes("I'm GramCare, your health assistant."), 'WhatsApp response should contain welcome message');
    console.log('✅ WhatsApp Webhook Test Passed');
  } catch (error) {
    console.error('❌ WhatsApp Webhook Test Failed:', error.message);
  }

  console.log('\n✨ Messaging Integration tests completed!');
}

testMessagingIntegration().catch(console.error);