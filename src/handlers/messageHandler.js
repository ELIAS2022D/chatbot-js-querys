import { changeUserData, getUserSession } from "../services/sessionsService.js";
import {
  hasBeenLongEnough,
  isAnOldMessage,
  waitingConfirmation,
} from "../utils/toolkit.js";
import { getClient } from "../services/clientsService.js";

const showMenu = (client) => {
  const options = client.menu?.options;

  if (!options) return "⚠ Este cliente no tiene opciones configuradas.";

  const hints = Object.values(options) //Me deshago de los keys. Me quedo solo con los values: {response: "", hint: ""}
    .map((opt) => opt?.hint) // Retorno solo los hints
    .filter(Boolean); // Elimino los que sean falsy y que no tengan contenido

  return [
    // Estoy retornando un array: [] entonces uso join para hacer salto de linea despues de cada elemento
    client.menu?.showMenu?.title,
    ...hints,
  ].join("\n");
};

const getDynamicResponse = async (clientName, message, session) => {
  if (isAnOldMessage(message)) return;

  const client = await getClient(clientName);

  if (hasBeenLongEnough(session.lastMessage, 0.05)) {
    changeUserData(clientName, message.from, "botPaused", false);
    return `Bienvenido/a de nuevo. \n${showMenu(client)}`;
  }

  if (session.botPaused) return;

  //Normalizo el texto del mensaje del usuario
  const normalizedText = message.body.toLowerCase().trim();

  //Si la palabra es la asignada para mostrar el menu, entonces devuelvo la lista de menu
  if(normalizedText === client.menu?.showMenu?.trigger?.toLowerCase().trim()) return showMenu(client);

  // ✅ Si coincide con una opción directa
  if (client.menu.options[normalizedText]) {
    return client.menu.options[normalizedText].response;
  }

  // 🔍 Si coincide con alguna keyword
  for (const [optionKey, keywordList] of Object.entries(client.keywords)) {
    const match = keywordList.some((keyword) =>
      normalizedText.includes(keyword.toLowerCase())
    );

    if (match && client.menu.options[optionKey]) {
      return client.menu.options[optionKey].hint;
    }
  }

  // ❌ Si no hay coincidencias
  return client.menu.default || "⚠ No entendí tu respuesta.";
};

const handleMessage = async (message, clientName, config) => {
  const session = await getUserSession(clientName, message);
  const replyText = await getDynamicResponse(clientName, message, session);
  return message.reply(replyText);
};

export { handleMessage };