// Dos clases del paquete whatsapp-web.js
// Client sirve para interactuar con WhatsApp
// LocalAuth guarda datos de sesión para no tener que iniciar sesión cada vez
import pkg from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import { getAllClients } from "./clientsService.js";
import { handleMessage } from "../handlers/messageHandler.js";
import { waitingConfirmation } from "../utils/toolkit.js";
const { Client, LocalAuth } = pkg;

const initializeService = async () => {
  //Trae todos los clientes de nuestro sistema
  const clientsConfig = await getAllClients();

  Object.entries(clientsConfig).forEach(([clientId, clientData]) => {
    //Si el cliente no está activo, no generamos QR (Sirve para dar de baja clientes)

    if (!clientData.active) return;

    const sanitizedClientName = clientData.name.toLowerCase().trim().replace(" ", "_");

    //Crea cliente para configurar
    const client = new Client({
      authStrategy: new LocalAuth({ clientId }),
    });

    client.on("qr", (qr) => {
      console.log(`\n🔗 QR para cliente ${config.name}\n`);
      console.log(`Implementar envío de QR al mail ${config?.mail} AQUI \n`)
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
      handleMessage(message, sanitizedClientName, clientData);
    });

    client.initialize();
  });
};

export { initializeService };
