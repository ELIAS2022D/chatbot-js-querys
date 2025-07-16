const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');

const respuestas = JSON.parse(fs.readFileSync('./respuestas.json', 'utf8'));

const usuariosSaludados = new Set();
const usuariosEnPausa = new Map();
const PAUSA_MS = 60 * 60 * 1000; // 1 hora

const client = new Client({
    authStrategy: new LocalAuth()
});

// Muestra el QR en consola y por URL
client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
    console.log('\n🔗 También podés escanear este enlace desde otro dispositivo:\n');
    console.log(`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qr)}&size=300x300`);
});

client.on('ready', () => {
    console.log('🤖 Bot listo para responder mensajes...');
});

client.on('message', async message => {
    const texto = message.body.toLowerCase();
    const id = message.from;
    const ahora = Date.now();

    if (usuariosEnPausa.has(id)) {
        const tiempoPausa = usuariosEnPausa.get(id);
        if ((ahora - tiempoPausa) < PAUSA_MS) {
            return; // Sigue en pausa
        } else {
            usuariosEnPausa.delete(id); // Reactivado
            console.log(`✅ Bot reactivado para: ${id}`);
        }
    }

    if (!usuariosSaludados.has(id)) {
        usuariosSaludados.add(id);
        if (respuestas["bienvenida"]) {
            await message.reply(respuestas["bienvenida"]);
        }

        // Enviar menú principal
        const menu = `
📋 *¿Qué necesitás hacer?*

1️⃣ Ver mis pólizas  
2️⃣ Consultar vencimientos  
3️⃣ Hablar con un asesor  
4️⃣ Comprar repuestos  

✏️ Escribí el número o palabra clave de la opción.
        `.trim();

        await message.reply(menu);
        return;
    }

    // Opciones del menú por número o texto
    if (texto === "1" || texto.includes("póliza")) {
        return message.reply(respuestas["ver polizas"] || "Aquí están tus pólizas.");
    }

    if (texto === "2" || texto.includes("vencimiento")) {
        return message.reply(respuestas["consultar vencimientos"] || "Tus vencimientos son...");
    }

    if (texto === "3" || texto.includes("asesor")) {
        usuariosEnPausa.set(id, ahora);
        return message.reply(respuestas["hablar con un asesor"] || "Te conectamos con un asesor. El bot se pausará por 1 hora.");
    }

    if (texto === "4" || texto.includes("repuestos")) {
        return message.reply(respuestas["comprar repuestos"] || "Podés comprar repuestos en nuestro sitio.");
    }

    // Claves personalizadas desde respuestas.json
    for (let clave in respuestas) {
        if (["bienvenida", "despedida", "__default", "hablar con un asesor", "ver polizas", "consultar vencimientos", "comprar repuestos"].includes(clave)) continue;
        if (texto.includes(clave.toLowerCase())) {
            return message.reply(respuestas[clave]);
        }
    }

    if (respuestas["__default"]) {
        message.reply(respuestas["__default"]);
    }
});

client.initialize();
