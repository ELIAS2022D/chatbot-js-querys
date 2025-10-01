import { changeUserData, getUserSession } from "../services/sessionsService.js";
import { hasBeenLongEnough, isAnOldMessage, waitingConfirmation } from "../utils/toolkit.js";
import { getClient } from "../services/clientsService.js";

const showOptions = (options) => {
  if (!options) return "⚠ Este cliente no tiene opciones configuradas.";

  const hints = Object.entries(options)
    .map(([key, opt]) => opt?.hint)
    .filter(Boolean);

  return hints.join("\n");
};

const getNestedValue = (obj, pathString) => {
  const keys = pathString.split(".");

  return keys.reduce((acc, key, index) => {
    if (!acc || acc[key] === undefined) return undefined;
    const next = acc[key];
    const isLast = index === keys.length - 1;
    return !isLast && next.type === "submenu" ? next.options : next;
  }, obj);
};

const getDynamicResponse = async (clientName, message, session) => {
  const client = await getClient(clientName); // Debería llamarse una vez por ejecución de sistema

  if (isAnOldMessage(message)) return;
  if (hasBeenLongEnough(session.lastMessage, 0.05)) {
    await changeUserData(clientName, message.from, "botPaused", false);
    return `Bienvenido/a de nuevo.\n\n${showOptions(client.menu.options)}`;
  }

  if (session.botPaused) return;

  // Normalizo el texto del mensaje del usuario
  const normalizedText = message.body.toLowerCase().trim();

  const nextNode =
    session.currentNode === "null"
      ? normalizedText
      : `${session.currentNode}.${normalizedText}`;

  const suboptions = getNestedValue(client.menu.options, nextNode);

  if (!suboptions) {
    return `${
      client.menu.default || "⚠ No entendí tu respuesta."
    }\n\n${showOptions(client.menu.options)}`;
  }

  session.currentNode = nextNode;
  await changeUserData(
    clientName,
    message.from,
    "currentNode",
    session.currentNode
  );

  if (suboptions?.type === "submenu") {
    return `${suboptions.response}\n\n${showOptions(suboptions.options)}`;
  }

  if (suboptions?.type === "static") {
    await changeUserData(clientName, message.from, "currentNode", null);
    return suboptions.response;
  }

  // 🟥🟥🟥 LÓGICA DE KEYWORDS 🟥🟥🟥
  for (const [optionKey, keywordList] of Object.entries(client.keywords)) {
    const match = keywordList.some((keyword) =>
      normalizedText.includes(keyword.toLowerCase())
    );

    if (match && client.menu.options[optionKey]) {
      return client.menu.options[optionKey].hint;
    }
  }

  // ❌ Si no hay coincidencias
  return `${
    client.menu.default || "⚠ No entendí tu respuesta."
  }\n\n${showOptions(client.menu.options)}`;
};

// const handleStatic = (option) => {
//   return option.response || "⚠ No hay respuesta definida.";
// };

// const handleSubmenu = (option) => {
//   const subHints = Object.entries(option.suboptions || {})
//     .map(([key, val]) => `*${key}*: ${val.response}`)
//     .join("\n");

//   return `${option.response}\n\n${subHints}`;
// };

const handleMessage = async (message, clientName, clientData) => {
  const session = await getUserSession(clientName, message);
  const replyText = await getDynamicResponse(clientName, message, session);
  return message.reply(replyText);
};

export { handleMessage };