import { changeUserData, getUserSession } from "../services/sessionsService.js";
import {
  formatCellphoneNumber,
  hasBeenLongEnough,
  isAnOldMessage,
  waitingConfirmation,
} from "../utils/toolkit.js";
import { getKeywordHint } from "./keywordHandler.js";

const resetSessionData = () => {
  //TO DO: Realizar una función que reinicie los datos dinamicos del usuario si hace mucho que no manda nada.
};

const isAdmin = (adminPhone, userPhone) => {
  return adminPhone === formatCellphoneNumber(userPhone);
};

const handleInputStart = async (clientName, message, option, nextNode) => {
  const inputKeys = Object.keys(option.inputs || {});
  if (inputKeys.length === 0) {
    await changeUserData(clientName, message.from, "currentNode", null);
    return "⚠ No hay campos definidos para esta consulta.";
  }

  await changeUserData(clientName, message.from, "inputFlow", JSON.stringify({
    keys: inputKeys,
    index: 0,
    values: {}
  }));

  return option.inputs[inputKeys[0]].prompt;
};

const handleInputProgress = async (client, clientName, message, session, option) => {
  const { keys, index, values } = session.inputFlow;
  const currentKey = keys[index];
  const currentField = option.inputs?.[currentKey];

  if (!currentField) {
    await changeUserData(clientName, message.from, "inputFlow", null);
    return "⚠ Campo no definido. Se canceló la carga.";
  }

  const inputValue = message.body.trim();
  const updatedValues = { ...values, [currentKey]: inputValue };

  if (currentField.required && !inputValue) {
    return `⚠ Este campo es obligatorio: ${currentField.prompt}`;
  }

  if (index + 1 < keys.length) {
    await changeUserData(clientName, message.from, "inputFlow", JSON.stringify({
      keys,
      index: index + 1,
      values: updatedValues
    }));

    const nextKey = keys[index + 1];
    const nextPrompt = option.inputs?.[nextKey]?.prompt;
    return nextPrompt || "⚠ Siguiente campo no definido.";
  }

  await changeUserData(clientName, message.from, "inputFlow", null);
  await changeUserData(clientName, message.from, "currentNode", null);

  const resumen = Object.entries(updatedValues)
    .map(([k, v]) => `*${k}*: ${v}`)
    .join("\n");

  return `✅ Datos recibidos:\n\n${resumen}\n\nGracias por tu consulta.`;
};

export const showOptions = (options) => {
  if (!options) return "⚠ Este cliente no tiene opciones configuradas.";

  const hints = Object.entries(options)
    .map(([key, opt]) => opt?.hint)
    .filter(Boolean);

  return hints.join("\n");
};

const getNestedValue = (obj, pathString) => { //Acá tengo que ajustar para que si es input, devuelva todas las keys de input que va a pedir el sistema
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

  const normalizedText = message.body.toLowerCase().trim();

  if (session.inputFlow) {
    const option = getNestedValue(client.menu.options, session.currentNode);
    return await handleInputProgress(client, clientName, message, session, option);
  }

  // Si el usuario aun no entró en un flujo de menúes, asignamos el valor ingresado en nextNode
  const nextNode = session.currentNode === "null" ? normalizedText : `${session.currentNode}.${normalizedText}`;
  // Función que evalúa si la opcion enviada por el usuario coincide con una respuesta valida
  const options = getNestedValue(client.menu.options, nextNode);

  //Si no hay opciones significa que lo que mandó el usuario está equivocado o no existen las opciones aún
  if (!options) {
    if (session.currentNode == "null") {

      // 🟥 Lógica de Keywords
      const keywordHint = getKeywordHint(client, normalizedText);
      if (keywordHint) return keywordHint;
    }

    const currentPath = session.currentNode;
    const currentNode = getNestedValue(client.menu.options, currentPath);
    const fallbackOptions =
      currentNode?.type === "submenu"
        ? showOptions(currentNode.options)
        : showOptions(client.menu.options);

    return `${client.menu.default || "⚠ No entendí tu respuesta."}\n\n${fallbackOptions}`;
  }

  session.currentNode = nextNode;
  await changeUserData(clientName, message.from, "currentNode", session.currentNode);

  switch (options?.type) {
    case "static": {
      await changeUserData(clientName, message.from, "currentNode", null);
      return options.response;
    }
    case "submenu": {
      return `${options.response}\n\n${showOptions(options.options)}`;
    }
    case "input": {
      return await handleInputStart(clientName, message, options, nextNode);
    }
  }
};

const handleMessage = async (message, clientName, clientData) => {
  const session = await getUserSession(clientName, message);
  if (isAnOldMessage(message) || session.botPaused) return;

  if (isAdmin(clientData.admin, message.from)) {
    // console.log("Es Admin");
    // return (replyText = await getDynamicResponseAdmin());
  }

  const replyText = await getDynamicResponse(
    clientName,
    message,
    session,
    clientData
  );
  return message.reply(replyText);
};

export { handleMessage };