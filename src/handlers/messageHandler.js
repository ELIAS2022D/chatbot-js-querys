import { changeUserData, getUserSession } from "../services/sessionsService.js";
import {
  formatCellphoneNumber,
  hasBeenLongEnough,
  isAnOldMessage,
  waitingConfirmation,
} from "../utils/toolkit.js";

const isAdmin = (adminPhone, userPhone) => {
  return adminPhone === formatCellphoneNumber(userPhone);
};

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
    //acc contiene todo el JSON de options
    if (!acc || acc[key] === undefined) return undefined; //Si no hay keys devuelve undefined

    const next = acc[key]; //obtengo el contenido de la siguiente key
    const isLast = index === keys.length - 1;
    return !isLast && next.type === "submenu" ? next.options : next; //Si el contenido de la siguiente key es submenu devuelvo las options y si no solamente el contenido
  }, obj);
};

const getDynamicResponse = async (clientName, message, session, client) => {
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
    const currentPath = session.currentNode;
    const currentNode = getNestedValue(client.menu.options, currentPath);

    const fallbackOptions =
      currentNode?.type === "submenu"
        ? showOptions(currentNode.options)
        : showOptions(client.menu.options);

    return `${
      client.menu.default || "⚠ No entendí tu respuesta."
    }\n\n${fallbackOptions}`;
  }

  session.currentNode = nextNode;
  await changeUserData(
    clientName,
    message.from,
    "currentNode",
    session.currentNode
  );

  switch (suboptions?.type) {
    case "static": {
      await changeUserData(clientName, message.from, "currentNode", null);
      return suboptions.response;
    }
    case "submenu": {
      return `${suboptions.response}\n\n${showOptions(suboptions.options)}`;
    }
    case "input": {
      console.log("Es tipo input");
      //TO DO Implementar entradas de variables
    }
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

const handleMessage = async (message, clientName, clientData) => {
  const session = await getUserSession(clientName, message);
  if (isAdmin(clientData.admin, message.from)) {
    console.log("Es Admin");
    // return (replyText = await getDynamicResponseAdmin());
  }

  const replyText = await getDynamicResponse(clientName,message,session,clientData);
  if (isAnOldMessage(message)) return;
  return message.reply(replyText);
};

export { handleMessage };
