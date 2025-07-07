const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');

const respuestas = JSON.parse(fs.readFileSync('./respuestas.json', 'utf8'));
const usuariosSaludados = new Set(); // para controlar quién ya recibió la bienvenida

const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', qr => {
    console.log("📱 Escaneá el siguiente código QR para vincular WhatsApp:");
    qrcode.generate(qr, { small: true });
    console.log("\n🔗 Si no lo ves bien, abrí este link en tu navegador:");
    console.log(`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qr)}&size=300x300`);
});

client.on('ready', () => {
    console.log('✅ Bot listo para responder mensajes...');
});

client.on('message', async message => {
    const texto = message.body.toLowerCase();
    const numero = message.from;

    // Bienvenida (solo la primera vez que el número escribe)
    if (!usuariosSaludados.has(numero)) {
        usuariosSaludados.add(numero);
        if (respuestas["bienvenida"]) {
            await message.reply(respuestas["bienvenida"]);
        }
    }

    // Detectar despedida
    const despedidas = ["chau", "chao", "adios", "hasta luego", "nos vemos"];
    if (despedidas.some(palabra => texto.includes(palabra))) {
        if (respuestas["despedida"]) {
            return message.reply(respuestas["despedida"]);
        }
    }

    // Respuestas por palabra clave
    for (let clave in respuestas) {
        if (["bienvenida", "despedida", "__default"].includes(clave)) continue;
        if (texto.includes(clave.toLowerCase())) {
            return message.reply(respuestas[clave]);
        }
    }

    // Respuesta por defecto
    if (respuestas["__default"]) {
        message.reply(respuestas["__default"]);
    }
});

client.initialize();

