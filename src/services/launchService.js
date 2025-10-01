import pkg from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import QRCode from "qrcode";
import { getAllClients } from "./clientsService.js";
import { handleMessage } from "../handlers/messageHandler.js";
import { waitingConfirmation } from "../utils/toolkit.js";
import { enviarMailConQR } from "../integrations/mailServices.js";

const { Client, LocalAuth } = pkg;

const initializeService = async () => {
  const clientsConfig = await getAllClients();

  Object.entries(clientsConfig).forEach(([clientId, clientData]) => {
    if (!clientData.active) return;

    const sanitizedClientName = clientData.name.toLowerCase().trim().replace(" ", "_");

    const client = new Client({
      authStrategy: new LocalAuth({ clientId }),
    });

    client.on("qr", async (qr) => {
      console.log(`\n🔗 QR para cliente ${clientData.name}\n`);

      const qrBase64 = await QRCode.toDataURL(qr);

      if (clientData?.mail) {
        await enviarMailConQR(clientData.mail, qrBase64, clientData.name);
      } else {
        console.log("⚠️ No se encontró un mail configurado para este cliente");
      }

      qrcode.generate(qr, { small: true });
    });

    client.on("ready", () => {
      console.log(`🤖 Chatbot de ${clientData.name} listo para responder mensajes!`);
    });

    client.on("message", async (message) => {
      handleMessage(message, sanitizedClientName, clientData);
    });

    client.initialize();
  });
};

export { initializeService };
