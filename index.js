const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');

// Leer respuestas desde un JSON
const respuestas = JSON.parse(fs.readFileSync('./respuestas.json', 'utf8'));

// Sets y Maps
const usuariosSaludados = new Set(); // Para bienvenida
const usuariosEnPausa = new Map();   // Usuarios pausados con hora

// Tiempo de pausa en milisegundos (1 hora)
const PAUSA_MS = 60 * 60 * 1000;

const client = new Client({
    authStrategy: new LocalAuth()
});

// Mostrar el código QR
client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

// Listo para funcionar
client.on('ready', () => {
    console.log('🤖 Bot listo para responder mensajes...');
});

// Manejar mensajes entrantes
client.on('message', async message => {
    const texto = message.body.toLowerCase();
    const id = message.from;
    const ahora = Date.now();

    // Verificar si el usuario está pausado
    if (usuariosEnPausa.has(id)) {
        const tiempoPausa = usuariosEnPausa.get(id);
        if ((ahora - tiempoPausa) < PAUSA_MS) {
            // Todavía está dentro del período de pausa
            return;
        } else {
            // Ya pasó la hora, reactivar
            usuariosEnPausa.delete(id);
            console.log(`✅ Bot reactivado para: ${id}`);
        }
    }

    // Bienvenida automática una sola vez
    if (!usuariosSaludados.has(id)) {
        usuariosSaludados.add(id);
        if (respuestas["bienvenida"]) {
            await message.reply(respuestas["bienvenida"]);
        }
    }

    // Si pide hablar con asesor
    if (texto.includes("hablar con un asesor")) {
        usuariosEnPausa.set(id, ahora);
        if (respuestas["hablar con un asesor"]) {
            return message.reply(respuestas["hablar con un asesor"]);
        } else {
            return message.reply("Te conectamos con un asesor. El bot se pausará por 1 hora.");
        }
    }

    // Responder por palabra clave
    for (let clave in respuestas) {
        if (["bienvenida", "despedida", "__default", "hablar con un asesor"].includes(clave)) continue;
        if (texto.includes(clave.toLowerCase())) {
            return message.reply(respuestas[clave]);
        }
    }

    // Respuesta por defecto si no encontró coincidencias
    if (respuestas["__default"]) {
        message.reply(respuestas["__default"]);
    }
});

// Inicializar
client.initialize();
