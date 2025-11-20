import whatsapp from 'whatsapp-web.js';
const { MessageMedia } = whatsapp;

import { saveClientMenu } from '../services/clientsService.js';
import { changeUserData, getUserSession } from '../services/sessionsService.js';
import { formatCellphoneNumber, hasBeenLongEnough, isAnOldMessage, waitingConfirmation } from '../utils/toolkit.js';
import { getKeywordHint } from './keywordHandler.js';
import { handleApiCall } from '../api/apiHandler.js';

const resetSessionData = async (clientName, message) => {
  await changeUserData(clientName, message.from, 'inputFlow', null);
  await changeUserData(clientName, message.from, 'currentNode', null);
};

const isAdmin = (adminPhone, userPhone) => {
  return adminPhone === formatCellphoneNumber(userPhone);
};

const handleInputStart = async (clientName, message, option, nextNode) => {
  const inputKeys = Object.keys(option.inputs || {});
  if (inputKeys.length === 0) {
    await changeUserData(clientName, message.from, 'currentNode', null);
    return '⚠ No hay campos definidos para esta consulta.';
  }

  await changeUserData(
    clientName,
    message.from,
    'inputFlow',
    JSON.stringify({
      keys: inputKeys,
      index: 0,
      values: {},
    })
  );

  return option.inputs[inputKeys[0]].prompt;
};

const handleInputProgress = async (client, clientName, message, session, option) => {
  const { keys, index, values } = session.inputFlow;
  const currentKey = keys[index];
  const currentField = option.inputs?.[currentKey];

  if (!currentField) {
    await changeUserData(clientName, message.from, 'inputFlow', null);
    return '⚠ Campo no definido. Se canceló la carga.';
  }

  const inputValue = message.body.trim();
  const updatedValues = { ...values, [currentKey]: inputValue };

  if (currentField.required && !inputValue) {
    return `⚠ Este campo es obligatorio: ${currentField.prompt}\n\nEscribí *${client.menu.quit}* para regresar al menú principal`;
  }

  if (index + 1 < keys.length) {
    await changeUserData(
      clientName,
      message.from,
      'inputFlow',
      JSON.stringify({
        keys,
        index: index + 1,
        values: updatedValues,
      })
    );

    const nextKey = keys[index + 1];
    const nextPrompt = option.inputs?.[nextKey]?.prompt;
    return `${nextPrompt || '⚠ Siguiente campo no definido.'}\n\nEscribí *${
      client.menu.quit
    }* para regresar al menú principal`;
  }

  await resetSessionData(clientName, message);

  const datos = Object.entries(updatedValues)
    .map(([k, v]) => `*${k}*: ${v}`)
    .join('\n');

  if (option.nextType === 'api') {
    const response = await handleApiCall(option.apiName || currentKey, updatedValues);
    if(response.error == true){
      return `${response.message}\n\n${showOptions(client.menu.options)}`
    }
    
    return response;
  }

  return `✅ Datos recibidos:\n\n${datos}\n\nGracias por tu consulta.`;
};

export const showOptions = options => {
  if (!options) return '⚠ Este cliente no tiene opciones configuradas.';

  const hints = Object.entries(options)
    .map(([key, opt]) => opt?.hint)
    .filter(Boolean);

  return hints.join('\n');
};

const getNestedValue = (obj, pathString) => {
  //Acá tengo que ajustar para que si es input, devuelva todas las keys de input que va a pedir el sistema
  const keys = pathString.split('.');

  return keys.reduce((acc, key, index) => {
    //acc contiene todo el JSON de options
    if (!acc || acc[key] === undefined) return undefined; //Si no hay keys devuelve undefined

    const next = acc[key]; //obtengo el contenido de la siguiente key
    const isLast = index === keys.length - 1;
    return !isLast && next.type === 'submenu' ? next.options : next; //Si el contenido de la siguiente key es submenu devuelvo las options y si no solamente el contenido
  }, obj);
};

const getDynamicResponse = async (clientName, message, session, client) => {
  if (hasBeenLongEnough(session.lastMessage, 0.05)) {
    await changeUserData(clientName, message.from, 'botPaused', false);
    return `👋Bienvenido/a de nuevo. Elija una opción del menú principal.\n\n🤖 Para regresar al menú ingrese *volver*\n\n🤖 Escriba *pausar* o *reactivar* el bot y chatear libremente con un asesor.\n\n${showOptions(client.menu.options)}`;
  }

  const normalizedText = message.body.toLowerCase().trim();

  if (normalizedText === client.menu.quit && session.currentNode != null) {
    await resetSessionData(clientName, message);
    return `👈Volviendo al menú principal...\n\n${showOptions(client.menu.options)}`;
  }

  if (session.inputFlow) {
    if (normalizedText == client.menu.quit) return null;
    const option = getNestedValue(client.menu.options, session.currentNode);
    return await handleInputProgress(client, clientName, message, session, option);
  }

  // Si el usuario aun no entró en un flujo de menúes, asignamos el valor ingresado en nextNode
  const nextNode = session.currentNode === 'null' ? normalizedText : `${session.currentNode}.${normalizedText}`;
  // Función que evalúa si la opcion enviada por el usuario coincide con una respuesta valida
  const options = getNestedValue(client.menu.options, nextNode);

  //Si no hay opciones significa que lo que mandó el usuario está equivocado o no existen las opciones aún
  if (!options) {
    if (session.currentNode == 'null') {
      // 🟥 Lógica de Keywords
      const keywordHint = getKeywordHint(client, normalizedText);
      if (keywordHint) return keywordHint;
    }

    const currentPath = session.currentNode;
    const currentNode = getNestedValue(client.menu.options, currentPath);
    const fallbackOptions =
      currentNode?.type === 'submenu' ? showOptions(currentNode.options) : showOptions(client.menu.options);

    return `${client.menu.default || '⚠ No entendí tu respuesta.'}\n\n${fallbackOptions}`;
  }

  session.currentNode = nextNode;
  await changeUserData(clientName, message.from, 'currentNode', session.currentNode);

  switch (options?.type) {
    case 'static': {
      await changeUserData(clientName, message.from, 'currentNode', null);
      return options.response;
    }
    case 'submenu': {
      return `${options.response}\n\n${showOptions(options.options)}`;
    }
    case 'input': {
      return await handleInputStart(clientName, message, options, nextNode);
    }
    case 'api': {
      const inputFlow = typeof session.inputFlow === 'string' ? JSON.parse(session.inputFlow) : session.inputFlow;
      const inputValues = inputFlow?.values || {};

      const apiResponse = await handleApiCall(options.apiName || normalizedText, inputValues);
      await resetSessionData(clientName, message);

      // Si la respuesta es un texto plano, devolvemos normal
      if (typeof apiResponse === 'string') return apiResponse;

      // Si la respuesta viene estructurada con archivo
      if (typeof apiResponse === 'object') {
        const { message: apiMessage, filePath } = apiResponse;

        // ✅ Enviar mensaje informativo
        await message.reply(apiMessage);

        // ✅ Si hay PDF adjunto, lo enviamos por WhatsApp
        if (filePath) {
          try {
            await message.client.sendMessage(message.from, {
              document: filePath,
              caption: '📎 Aquí tenés tu póliza en PDF.',
              mimetype: 'application/pdf',
            });
          } catch (err) {
            console.error('❌ Error enviando PDF:', err.message);
            return '⚠ No se pudo enviar el archivo PDF. Por favor, intentá más tarde.';
          }
        }

        // No retornamos nada más porque ya enviamos el mensaje y el archivo
        return null;
      }

      return '⚠ Respuesta desconocida de la API.';
    }
  }
};

const handleMessage = async (message, clientName, clientData) => {
  const session = await getUserSession(clientName, message);
  const text = message.body.toLowerCase().trim();
  
  // --------------------------------------
  // 🚫 BLOQUEAR NÚMEROS BANEADOS
  // --------------------------------------
  const cleanNumber = formatCellphoneNumber(message.from);

  if (clientData.bannedNumbers?.includes(cleanNumber)) {
    // Si querés que NO responda nada:
    return;

    // Si querés enviar un mensaje avisando, reemplazá por:
    // return message.reply("🚫 No estás autorizado para usar este servicio.");
  }
  // --------------------------------------
  // ⛔ PAUSAR EL BOT
  // --------------------------------------
  if (text === "pausar") {
    await changeUserData(clientName, message.from, "botPaused", true);
    return message.reply("🤖 Bot pausado. Ahora pueden chatear libremente.");
  }

  // --------------------------------------
  // ⚡ REACTIVAR EL BOT
  // --------------------------------------
  if (text === "reactivar") {
    await changeUserData(clientName, message.from, "botPaused", false);
    return message.reply("🤖 Bot reactivado. Vuelve a funcionar normalmente.");
  }

  // --------------------------------------
  // 🛑 SI EL BOT ESTÁ PAUSADO → NO RESPONDE
  // --------------------------------------
  if (session.botPaused) return;

  // --------------------------------------
  // 🕒 SI EL MENSAJE ES VIEJO → NO RESPONDE
  // --------------------------------------
  if (isAnOldMessage(message)) return;

  // ==============================
  // ⚙️ ADMIN — EDICIÓN SIMPLE DEL MENÚ
  // ==============================
  if (isAdmin(clientData.admin, message.from)) {
    const text = message.body.trim().toLowerCase();
    const menu = clientData.menu;

    // ================================================
    // 📌 VER QUÉ COSAS PUEDE CAMBIAR EL ADMIN
    // Comando: "ver opciones"
    // ================================================
    if (text === "admin") {

      const adminName = clientData.name || clientName;

      const editable =
        `Bienvenido Admin de *${adminName}* 🛠\n` +
        `Aquí tiene sus opciones disponibles para su edición:\n\n` +

        "1️⃣ *Cambiar bienvenida*\n" +
        "   ➤ escribir: cambiar bienvenida a: TU_TEXTO\n\n" +

        "2️⃣ *Cambiar la respuesta de una opción*\n" +
        "   ➤ escribir: cambiar respuesta de 'NOMBRE_OPCION' a: TU_TEXTO\n\n" +

        "3️⃣ *Cambiar el texto del hint (texto corto del menú)*\n" +
        "   ➤ escribir: cambiar hint de 'NOMBRE_OPCION' a: TU_TEXTO\n\n" +

        "4️⃣ *Cambiar el texto principal de un submenú*\n" +
        "   ➤ escribir: cambiar texto de 'NOMBRE_OPCION' a: TU_TEXTO\n\n";

      return message.reply(editable);
    }

    // ======================================================
    // 1. CAMBIAR BIENVENIDA
    // ======================================================
    if (text.startsWith("cambiar bienvenida a:")) {
      const newWelcome = message.body.split(":")[1].trim();

      menu.welcome = newWelcome;

      await saveClientMenu(clientName, menu);
      clientData.menu = menu; // actualizar en memoria

      return message.reply("✅ La bienvenida fue actualizada.");
    }

    // ======================================================
    // 2. CAMBIAR RESPUESTA DE UNA OPCIÓN
    // Ejemplo: cambiar respuesta de 'ayuda' a: nuevo texto
    // ======================================================
    if (text.startsWith("cambiar respuesta de")) {
      const optionName = text.split("cambiar respuesta de")[1]
        .split("a:")[0]
        .trim()
        .replace(/'/g, "")
        .replace(/"/g, "");

      const newResponse = message.body.split("a:")[1].trim();

      if (!menu.options[optionName]) {
        return message.reply(`⚠ La opción '${optionName}' no existe.`);
      }

      menu.options[optionName].response = newResponse;

      await saveClientMenu(clientName, menu);
      clientData.menu = menu; // actualizar en memoria

      return message.reply(`✅ La respuesta de '${optionName}' fue actualizada.`);
    }

    // ======================================================
    // 3. CAMBIAR HINT DE UNA OPCIÓN
    // ======================================================
    if (text.startsWith("cambiar hint de")) {
      const optionName = text.split("cambiar hint de")[1]
        .split("a:")[0]
        .trim()
        .replace(/'/g, "")
        .replace(/"/g, "");

      const newHint = message.body.split("a:")[1].trim();

      if (!menu.options[optionName]) {
        return message.reply(`⚠ La opción '${optionName}' no existe.`);
      }

      menu.options[optionName].hint = newHint;

      await saveClientMenu(clientName, menu);
      clientData.menu = menu; // actualizar en memoria

      return message.reply(`✅ El hint de '${optionName}' fue actualizado.`);
    }

    // ======================================================
    // 4. CAMBIAR TEXTO DE SUBMENÚ (response)
    // ======================================================
    if (text.startsWith("cambiar texto de")) {
      const optionName = text.split("cambiar texto de")[1]
        .split("a:")[0]
        .trim()
        .replace(/'/g, "")
        .replace(/"/g, "");

      const newText = message.body.split("a:")[1].trim();

      if (!menu.options[optionName]) {
        return message.reply(`⚠ La opción '${optionName}' no existe.`);
      }

      menu.options[optionName].response = newText;

      await saveClientMenu(clientName, menu);
      clientData.menu = menu; // actualizar en memoria

      return message.reply(`📝 El texto de '${optionName}' fue actualizado.`);
    }
  }

  const reply = await getDynamicResponse(clientName, message, session, clientData);

  if (!reply) return;

  if (typeof reply === 'string') {
    return message.reply(reply);
  }

  if (typeof reply === 'object') {
    if (reply.fileBase64) {
      await message.reply(reply.message);

      const media = new MessageMedia(reply.mimeType, reply.fileBase64, reply.fileName);
      return message.reply(media);
    }

    if (reply.message) {
      return message.reply(reply.message);
    }
  }
};

export { handleMessage };