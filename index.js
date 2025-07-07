const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');

const respuestas = JSON.parse(fs.readFileSync('./respuestas.json', 'utf8'));

const usuariosSaludados = new Set(); // para saludo inicial
const usuariosDerivados = new Set(); // para quienes pidieron hablar con asesor

const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', qr => {
    console.log("📱 Escaneá el código QR o abrí este link:");
    qrcode.generate(qr, { small: true });
    console.log(`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qr)}&size=300x300`);
});

client.on('ready', () => {
    console.log('✅ Bot listo para responder mensajes...');
});

client.on('message', async message => {
    const texto = message.body.toLowerCase();
    const numero = message.from;

    // Si ya fue derivado a un asesor, no responder más
    if (usuariosDerivados.has(numero)) {
        return;
    }

    // Bienvenida (solo la primera vez)
    if (!usuariosSaludados.has(numero)) {
        usuariosSaludados.add(numero);
        if (respuestas["bienvenida"]) {
            await message.reply(respuestas["bienvenida"]);
        }
    }

    // Si el usuario quiere hablar con un asesor
    if (texto.includes("hablar con un asesor")) {
        usuariosDerivados.add(numero);
        if (respuestas["hablar con un asesor"]) {
            return message.reply(respuestas["hablar con un asesor"]);
        }
    }

    // Despedida
    const despedidas = ["chau", "chao", "adios", "hasta luego", "nos vemos"];
    if (despedidas.some(p => texto.includes(p))) {
        if (respuestas["despedida"]) {
            return message.reply(respuestas["despedida"]);
        }
    }

    // Respuestas automáticas
    for (let clave in respuestas) {
        if (["bienvenida", "despedida", "__default", "hablar con un asesor"].includes(clave)) continue;
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
