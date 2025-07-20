const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');

const respuestas = JSON.parse(fs.readFileSync('./respuestas.json', 'utf8'));

const usuariosSaludados = new Set();

const client = new Client({
    authStrategy: new LocalAuth()
});

// Muestra QR
client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
    console.log('\n🔗 Escaneá desde otro dispositivo:\n');
    console.log(`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qr)}&size=300x300`);
});

client.on('ready', () => {
    console.log('🤖 Bot listo para responder mensajes...');
});

// Función para enviar el menú
const enviarMenu = async (message) => {
    const menu = `
🔧 *¿Qué necesitás hacer?*

1️⃣ Reparar mi notebook  
2️⃣ Arreglar mi PlayStation  
3️⃣ Consultar estado de reparación  
4️⃣ Hablar con un técnico  

✏️ Escribí el número o palabra clave de la opción.  
🧭 Escribí *menu* para volver al menú o *finalizar* para cerrar la conversación.
    `.trim();

    await message.reply(menu);
};

client.on('message', async message => {
    const texto = message.body.toLowerCase();
    const id = message.from;

    // FINALIZAR
    if (texto === "finalizar") {
        usuariosSaludados.delete(id);
        return message.reply("✅ Conversación finalizada. Escribí *hola* o cualquier mensaje para empezar de nuevo.");
    }

    // VOLVER AL MENÚ
    if (texto === "menu") {
        return enviarMenu(message);
    }

    // PRIMER CONTACTO
    if (!usuariosSaludados.has(id)) {
        usuariosSaludados.add(id);
        await message.reply(respuestas["bienvenida"]);
        return enviarMenu(message);
    }

    // OPCIONES DEL MENÚ
    if (texto === "1" || texto.includes("notebook")) {
        return message.reply(respuestas["reparar notebook"]);
    }

    if (texto === "2" || texto.includes("playstation") || texto.includes("ps4") || texto.includes("ps5")) {
        return message.reply(respuestas["reparar playstation"]);
    }

    if (texto === "3" || texto.includes("estado") || texto.includes("reparación")) {
        return message.reply(respuestas["estado reparacion"]);
    }

    if (texto === "4" || texto.includes("técnico") || texto.includes("hablar con un técnico") || texto.includes("asesor")) {
        return message.reply(respuestas["hablar con tecnico"] || 
            "🔧 Para hablar con un técnico hacé clic acá 👉 https://wa.me/5491131433906\n\nMientras tanto, podés volver al *menu* si necesitás otra cosa.");
    }

    // RESPUESTAS PERSONALIZADAS
    for (let clave in respuestas) {
        if (["bienvenida", "hablar con tecnico", "reparar notebook", "reparar playstation", "estado reparacion", "__default"].includes(clave)) continue;
        if (texto.includes(clave.toLowerCase())) {
            return message.reply(respuestas[clave]);
        }
    }

    // RESPUESTA POR DEFAULT
    if (respuestas["__default"]) {
        message.reply(respuestas["__default"]);
    }
});
