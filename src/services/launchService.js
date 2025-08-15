// Dos clases del paquete whatsapp-web.js
// Client sirve para interactuar con WhatsApp
// LocalAuth guarda datos de sesión para no tener que iniciar sesión cada vez
import pkg from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import fs from "fs";
import getClients from "./clientsService.js";
import handleMessage from "../handlers/messageHandler.js";
const { Client, LocalAuth } = pkg;

function initializeService() {
  //Trae informacion de todos los clientes con los que trabajamos (clients.json)
  //Reemplazaríamos esta linea:
  const respuestas = JSON.parse(fs.readFileSync("./respuestas.json", "utf8"));

  //Recibo el JSON de los clientes en el sistema
  const clients = getClients();

  const usuariosSaludados = new Set();
  const esperandoDatos = new Set();

  // Por cada cliente debemos hacer lo siguiente:
  //---------------------------------------------------------
  Object.entries(clientsConfig).forEach(([clientId, config]) => {
    if (config.active) {
      const client = new Client({
        authStrategy: new LocalAuth(),
      });

      // Muestra QR
      client.on("qr", (qr) => {
        qrcode.generate(qr, { small: true });
        console.log(`\n🔗 QR para cliente ${config.name}\n`);
        //Esta linea no es necesaria
        // console.log(`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qr)}&size=100x100`);
      });

      // Funcion que se ejecuta cuando el chatbot comienza a funcionar
      client.on("ready", () => {
        console.log(`🤖 Chatbot de ${config.name} listo para responder mensajes!`);
      });

      // Funcion que se ejecuta al recibir un mensaje
      client.on("message", async (message) => {
        handleMessage(message, config.menu);
      });

      client.initialize();
    }
  });
  //---------------------------------------------------------
}

export default initializeService;
