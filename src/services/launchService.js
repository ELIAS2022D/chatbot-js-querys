// Dos clases del paquete whatsapp-web.js
// Client sirve para interactuar con WhatsApp
// LocalAuth guarda datos de sesión para no tener que iniciar sesión cada vez
import pkg from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import { getAllClients } from "./clientsService.js";
import { handleMessage } from "../handlers/messageHandler.js";
const { Client, LocalAuth } = pkg;

const initializeService = () => {
  //Trae todos los clientes de nuestro sistema
  const clientsConfig = getAllClients();

  Object.entries(clientsConfig).forEach(([clientId, config]) => {
    //Si el cliente no está activo, no generamos QR (Sirve para dar de baja clientes)
    if (!config.active) return;

    //Crea cliente para configurar
    const client = new Client({
      authStrategy: new LocalAuth({ clientId }),
    });

    client.on("qr", (qr) => {
      console.log(`\n🔗 QR para cliente ${config.name}\n`);
      qrcode.generate(qr, { small: true });
      console.log(
        `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
          qr
        )}&size=100x100`
      );
      //Necesitamos conseguir una manera de enviar el QR de manera más directa al usuario y esteticamente mejor (Quizás con un bot propio)
    });

    client.on("ready", () => {
      console.log(
        `🤖 Chatbot de ${config.name} listo para responder mensajes!`
      );
    });

    client.on("message", async (message) => {
      //message.body → el texto del mensaje | message.from → el número del cliente | message.reply() → para responder
      //clientId → Es la clave que identifica al cliente en clients.json. Ejemplo: "client1", "client2", (NO el nombre) etc.
      //clientsConfig[clientId] → Es el objeto de configuración completo de ese cliente. Incluye: name menu keywords active
      handleMessage(message, clientId, clientsConfig[clientId]);
    });

    client.initialize(); // No se espera, se lanza y los eventos se gestionan solos
  });
};

export { initializeService };
