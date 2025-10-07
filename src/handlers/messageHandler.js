import { changeUserData, getUserSession } from "../services/sessionsService.js";
import getKeywordHint from "../utils/keywordMatcher.js";
import { getNestedValue, showOptions } from "../utils/navigationUtils.js";
import {
  formatCellphoneNumber,
  hasBeenLongEnough,
  isAnOldMessage,
  waitingConfirmation,
} from "../utils/toolkit.js";
import { handleInputProgress, handleInputStart } from "./inputHandler.js";
import { handleSessionTimeout } from "./sessionHandler.js";

const isAdmin = (adminPhone, userPhone) => {
  return adminPhone === formatCellphoneNumber(userPhone);
};

const handleRootMenu = async (clientName, message, client, normalizedText) => {
  // Al ser la primer opción se guarda 
  const nextNode = normalizedText;
  const option = getNestedValue(client.menu.options, nextNode);

  if (!option) {
    const keywordHint = getKeywordHint(normalizedText, client);
    if (keywordHint) return keywordHint;

    return `${client.menu.default || "⚠ No entendí tu respuesta."}\n\n${showOptions(client.menu.options)}`;
  }

  await changeUserData(clientName, message.from, "currentNode", nextNode);

  switch (option.type) {
    case "static":
      await changeUserData(clientName, message.from, "currentNode", null);
      return option.response;
    case "submenu":
      return `${option.response}\n\n${showOptions(option.options)}`;
    case "input":
      return await handleInputStart(clientName, message, option, nextNode);
    default:
      return `${client.menu.default || "⚠ Opción no válida."}\n\n${showOptions(client.menu.options)}`;
  }
};

const handleActiveNode = async (clientName, message, client, session, normalizedText) => {
  const currentOption = getNestedValue(client.menu.options, session.currentNode);

  if (!currentOption) {
    await changeUserData(clientName, message.from, "currentNode", null);
    return `⚠ Opción no encontrada.\n\n${showOptions(client.menu.options)}`;
  }

  // Si estamos cargando datos (inputFlow activo)
  if (session.inputFlow) {
    return await handleInputProgress(client, clientName, message, session, currentOption);
  }

  // Si el nodo actual es de tipo input pero no hay inputFlow, algo salió mal
  if (currentOption.type === "input") {
    await changeUserData(clientName, message.from, "currentNode", null);
    await changeUserData(clientName, message.from, "inputFlow", null);
    return `⚠ Error en el flujo de entrada.\n\n${showOptions(client.menu.options)}`;
  }

  // Si es un submenu, navegamos dentro de él
  if (currentOption.type === "submenu") {
    const nextNode = `${session.currentNode}.${normalizedText}`;
    const nextOption = getNestedValue(client.menu.options, nextNode);

    if (!nextOption) {
      return `${client.menu.default || "⚠ No entendí tu respuesta."}\n\n${showOptions(currentOption.options)}`;
    }

    await changeUserData(clientName, message.from, "currentNode", nextNode);

    switch (nextOption.type) {
      case "static":
        await changeUserData(clientName, message.from, "currentNode", null);
        return nextOption.response;

      case "submenu":
        return `${nextOption.response}\n\n${showOptions(nextOption.options)}`;

      case "input":
        return await handleInputStart(clientName, message, nextOption, nextNode);

      default:
        return `${client.menu.default || "⚠ Opción no válida."}\n\n${showOptions(currentOption.options)}`;
    }
  }

  // Si llegamos aquí, algo inesperado ocurrió
  await changeUserData(clientName, message.from, "currentNode", null);
  return `⚠ Estado inesperado.\n\n${showOptions(client.menu.options)}`;
};

const getDynamicResponse = async (clientName, message, session, client) => {
  // Verificar si ha pasado suficiente tiempo (timeout/reset)
  handleSessionTimeout(clientName, message.from, client, session);

  const normalizedMessage = message.body.toLowerCase().trim();

  // Flujo principal: verificar si estamos en el menú raíz o dentro de una opción
  if (session.currentNode === "null" || !session.currentNode) {
    // Estamos en el menú raíz
    return await handleRootMenu(clientName, message, client, normalizedMessage);
  } else {
    // Ya estamos dentro de una opción (puede ser input o submenu)
    return await handleActiveNode(clientName, message, client, session, normalizedMessage);
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