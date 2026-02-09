const fetch = require('node-fetch');

const API_URL = 'http://localhost:4000/api/asaas/pay';

async function testBypass() {
    console.log('Testing Test Card Bypass (Port 4000)...');

    const payload = {
        paymentMethod: 'CREDIT_CARD',
        customer: {
            name: 'Test User',
            email: 'test@example.com',
            cpfCnpj: '12345678909',
            phone: '11999999999'
        },
        creditCard: {
            holderName: 'Matheus Lyam',
            holderCpfCnpj: '12345678909',
            holderEmail: 'test@example.com',
            holderPhone: '11999999999',
            holderPostalCode: '12345678',
            holderAddressNumber: '123',
            number: '0000000000000000',
            expiryMonth: '99',
            expiryYear: '2099',
            ccv: '999'
        },
        installments: 1
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ Test Card Bypass SUCCESS');
            console.log('Payment ID:', data.payment?.id);
        } else {
            console.log('❌ Test Card Bypass FAILED');
            console.log('Status:', response.status);
            console.log('Response:', JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.log('❌ Request Failed:', error.message);
    }
}

testBypass();
