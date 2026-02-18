
const axios = require('axios');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
const envPath = path.resolve(__dirname, '../.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.error('Error loading .env file:', result.error);
} else {
    console.log('.env loaded successfully from:', envPath);
}

// Handle double-escaped keys from .env if present
let apiKey = process.env.ASAAS_API_KEY;
if (apiKey && apiKey.startsWith('$$')) {
    apiKey = '$' + apiKey.substring(2);
}

const apiUrl = process.env.ASAAS_API_URL || 'https://api.asaas.com/v3';

console.log('--- Testing Asaas API Connection ---');
console.log(`URL: ${apiUrl}`);
console.log(`Key: ${apiKey ? apiKey.substring(0, 5) + '...' : 'UNDEFINED'}`);

async function testConnection() {
    try {
        const response = await axios.get(`${apiUrl}/customers?limit=1`, {
            headers: {
                'access_token': apiKey
            }
        });
        console.log('✅ Connection Successful!');
        console.log('Response Status:', response.status);
    } catch (error) {
        console.error('❌ Connection Failed!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

async function testWebhook() {
    console.log('\n--- Testing Local Webhook Endpoint ---');
    try {
        // Mock payload representing a payment received event
        const payload = {
            event: 'PAYMENT_RECEIVED',
            payment: {
                id: 'pay_test_123',
                customer: 'cus_test_123',
                value: 100.00,
                netValue: 99.00,
                billingType: 'PIX',
                status: 'RECEIVED'
            }
        };

        const response = await axios.post('http://localhost:4000/api/asaas/webhook', payload, {
            headers: {
                'asaas-access-token': process.env.ASAAS_WEBHOOK_TOKEN || 'webhook_checkout'
            }
        });
        console.log('✅ Webhook Test Successful!');
        console.log('Response Status:', response.status);
        console.log('Response Data:', response.data);
    } catch (error) {
        console.error('❌ Webhook Test Failed!');
        if (error.response) {
            // 404 is expected if the route doesn't exist yet or is listening on a different path
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

(async () => {
    await testConnection();
    await testWebhook();
})();
