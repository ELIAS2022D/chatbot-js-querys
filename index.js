const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');

const respuestas = JSON.parse(fs.readFileSync('./respuestas.json', 'utf8'));

const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', qr => {
    console.log("📱 Escaneá el siguiente código QR para vincular WhatsApp:");
    qrcode.generate(qr, { small: true });

    // Mostrar link directo al QR en caso de que no se vea bien
    console.log("\n🔗 Si no lo ves bien, abrí este link en tu navegador:");
    console.log(`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qr)}&size=300x300`);
});

client.on('ready', () => {
    console.log('✅ Bot listo para responder mensajes...');
});

client.on('message', message => {
    const texto = message.body.toLowerCase();

    for (let clave in respuestas) {
        if (texto.includes(clave.toLowerCase())) {
            return message.reply(respuestas[clave]);
        }
    }

    if (respuestas["__default"]) {
        message.reply(respuestas["__default"]);
    }
});

client.initialize();
