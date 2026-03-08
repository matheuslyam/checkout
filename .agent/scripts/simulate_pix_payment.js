const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, '../../data/hybrid_logs.json');

// Get the Hybrid ID or Pix ID from command line arguments
const pixPaymentId = process.argv[2];

if (!pixPaymentId) {
    console.error('❌ Err: Forneça o ID do PIX Asaas (ex: pay_123) gerado pelo Checkout Híbrido.');
    process.exit(1);
}

try {
    const fileData = fs.readFileSync(logFilePath, 'utf8');
    const logs = JSON.parse(fileData);
    let found = false;

    // Search and update the target PIX to PAID
    for (const [hybridId, data] of Object.entries(logs)) {
        if (data.pixPaymentId === pixPaymentId || hybridId === pixPaymentId) {
            data.pixStatus = 'RECEIVED';
            found = true;
            console.log(`✅ Sucesso! O Status Híbrido [${hybridId}] de PIX [${data.pixPaymentId}] foi forçado para RECEIVED no DB local.`);
            break;
        }
    }

    if (found) {
        fs.writeFileSync(logFilePath, JSON.stringify(logs, null, 2));
        console.log('🔄 O Frontend (via Polling de 5 secs) deve liberar dinamicamente o Cartão agora.');
    } else {
        console.error(`❌ Err: Não foi possível rastrear a sessão do pagamento [${pixPaymentId}] no log file.`);
    }

} catch (error) {
    console.error('❌ Err crítico acessando o DB local:', error.message);
}
