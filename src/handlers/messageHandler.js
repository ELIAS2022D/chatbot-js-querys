import { existUserSession, createUserSession } from "../services/usersSessionsService.js";

const sessions = {}; // Estado de usuarios en memoria (submenús activos)

const handleMessage = async (message, clientId, config) => {
  const texto = message.body.trim().toLowerCase();
  const keywords = config.keywords;
  const menu = config.menu;
  const userId = message.from;

  // Si todavía no se creó el user session significa que es la primera vez que habla
  if (!(await existUserSession(message, clientId))) {
    await createUserSession(message, clientId);
  }

  // Si escribe "hola" o "menu", siempre volvemos al inicio
  if (texto === "hola" || texto === "menu") {
    sessions[userId] = null;
    return message.reply(menu.welcome);
  }

  // Detectamos en qué parte del menú está el usuario
  const currentSession = sessions[userId];

  // ---- MENÚ PRINCIPAL ----
  if (!currentSession) {
    switch (texto) {
      case "1":
      case "cotizacion":
        sessions[userId] = "1"; // va al submenú cotización
        return message.reply(menu.response1);

      case "2":
      case "denunciar":
        sessions[userId] = "waitingData"; // espera datos del cliente
        return message.reply(menu.response2);

      case "3":
      case "poliza":
      case "cupon":
        sessions[userId] = "3"; // va al submenú póliza
        return message.reply(menu.response3);

      case "4":
      case "anulacion":
        sessions[userId] = "waitingData"; // espera datos del cliente
        return message.reply(menu.response4);

      case "5":
      case "grua":
        sessions[userId] = "waitingData"; // espera datos del cliente
        return message.reply(menu.response5);

      case "6":
      case "otras":
        sessions[userId] = "waitingData"; // espera datos del cliente
        return message.reply(menu.response6);

      case "7":
      case "asesor":
        sessions[userId] = "waitingData"; // espera datos del cliente
        return message.reply(menu.response7);

      default:
        // Keywords: si encuentra coincidencia devuelve la respuesta asociada
        for (const [responseKey, keywordList] of Object.entries(keywords)) {
          if (keywordList.some((kw) => texto.includes(kw))) {
            return message.reply("Creo que te refieres a esto: \n" + menu[responseKey]);
          }
        }
        return message.reply(menu.default);
    }
  }

  // ---- SUBMENÚ COTIZACIÓN ----
  if (currentSession === "1") {
    switch (texto) {
      case "1":
        sessions[userId] = "waitingData";
        return message.reply(menu.response1_1);
      case "2":
        sessions[userId] = "waitingData";
        return message.reply(menu.response1_2);
      case "3":
        sessions[userId] = "waitingData";
        return message.reply(menu.response1_3);
      default:
        return message.reply(menu.default);
    }
  }

  // ---- SUBMENÚ PÓLIZA ----
  if (currentSession === "3") {
    switch (texto) {
      case "1":
        sessions[userId] = "waitingData";
        return message.reply(menu.response3_1);
      case "2":
        sessions[userId] = "waitingData";
        return message.reply(menu.response3_2);
      default:
        return message.reply(menu.default);
    }
  }

  // ---- CAPTURA DE DATOS (cuando el cliente ya elige opción y escribe libremente) ----
  if (currentSession === "waitingData") {
    sessions[userId] = null; // volvemos al menú principal después de recibir datos
    return message.reply("✅ Recibido, en instantes tendrá su respuesta.");
  }

  // Si nada coincide
  return message.reply(menu.default);
};

export { handleMessage };
