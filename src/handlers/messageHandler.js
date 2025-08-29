import { existUserSession, createUserSession } from "../services/usersSessionsService.js";

const sessions = {}; // Estado de usuarios en memoria (submenús activos)

// --- Helpers ---
const hasMinLines = (text, n) =>
  text.split("\n").map(l => l.trim()).filter(Boolean).length >= n;

const includesAny = (text, arr) =>
  arr.some(k => text.includes(k));

// Validación de formularios según la opción
const validateForm = (session, rawText) => {
  // Contamos líneas con el texto original (no lowercased)
  const ok = {
    waitingDataPoliza: hasMinLines(rawText, 2),      // p.ej.: Nº póliza + Nombre/DNI
    waitingDataGenerico: hasMinLines(rawText, 2),    // grúa, anulación, otras, denunciar
    waitingDataCotizacion: hasMinLines(rawText, 4),  // auto/moto/hogar: 4+ líneas
  };
  return ok[session] ?? false;
};

const handleMessage = async (message, clientId, config) => {
  const texto = message.body.trim().toLowerCase();
  const menu = config.menu;
  const keywords = config.keywords || {};
  const userId = message.from;

  // Si es primer contacto, creamos sesión de usuario persistente (tu servicio)
  if (!(await existUserSession(message, clientId))) {
    await createUserSession(message, clientId);
  }

  // Reset al inicio
  if (texto === "hola" || texto === "menu") {
    sessions[userId] = null;
    return message.reply(menu.welcome);
  }

  // En qué parte del flujo está
  const currentSession = sessions[userId];

  // ---- MENÚ PRINCIPAL ----
  if (!currentSession) {
    switch (texto) {
      case "1":
      case "cotizacion":
        sessions[userId] = "1";             // submenú cotización
        return message.reply(menu.response1);

      case "2":
      case "denunciar":
        sessions[userId] = "waitingDataGenerico";
        return message.reply(menu.response2);

      case "3":
      case "poliza":
      case "póliza":
      case "cupon":
      case "cupón":
        sessions[userId] = "3";             // submenú póliza/cupón
        return message.reply(menu.response3);

      case "4":
      case "anulacion":
      case "anulación":
        sessions[userId] = "waitingDataGenerico";
        return message.reply(menu.response4);

      case "5":
      case "grua":
      case "grúa":
        sessions[userId] = "waitingDataGenerico";
        return message.reply(menu.response5);

      case "6":
      case "otras":
        sessions[userId] = "waitingDataGenerico";
        return message.reply(menu.response6);

      case "7":
      case "asesor":
        sessions[userId] = "waitingDataGenerico";
        return message.reply(menu.response7);

      default:
        // Keywords sueltos
        for (const [responseKey, list] of Object.entries(keywords)) {
          if (list.some(kw => texto.includes(kw))) {
            return message.reply("Creo que te refieres a esto: \n" + menu[responseKey]);
          }
        }
        return message.reply(menu.default);
    }
  }

  // ---- SUBMENÚ COTIZACIÓN (1) ----
  if (currentSession === "1") {
    switch (texto) {
      case "1":
        sessions[userId] = "waitingDataCotizacion";
        return message.reply(
          (menu.response1_1 || "") +
          "\n\n✍️ Enviá los datos (una línea por ítem):\nNombre y apellido\nMarca/Modelo/Año\nPatente"
        );
      case "2":
        sessions[userId] = "waitingDataCotizacion";
        return message.reply(
          (menu.response1_2 || "") +
          "\n\n✍️ Enviá los datos (una línea por ítem):\nNombre y apellido\nMarca/Modelo/Año\nCilindrada\nPatente"
        );
      case "3":
        sessions[userId] = "waitingDataCotizacion";
        return message.reply(
          (menu.response1_3 || "") +
          "\n\n✍️ Enviá los datos (una línea por ítem):\nNombre y apellido\nDirección\nTipo de vivienda\nMetros cuadrados/Valor contenido"
        );
      default:
        return message.reply(menu.default);
    }
  }

  // ---- SUBMENÚ PÓLIZA/CUPÓN (3) ----
  if (currentSession === "3") {
    // Aceptamos números 1/2 y también palabras clave
    if (texto === "1" || includesAny(texto, ["poliza", "póliza"])) {
      sessions[userId] = "waitingDataPoliza";
      return message.reply(
        (menu.response3_1 || "📑 Para póliza, enviá:") +
        "\n\n✍️ Formato (una línea por ítem):\nN° de póliza\nNombre\nDNI"
      );
    }
    if (texto === "2" || includesAny(texto, ["cupon", "cupón", "comprobante"])) {
      sessions[userId] = "waitingDataPoliza";
      return message.reply(
        (menu.response3_2 || "💳 Para cupón, enviá:") +
        "\n\n✍️ Formato (una línea por ítem):\nN° de póliza\nNombre\nDNI"
      );
    }

    // Si el usuario pega directamente los datos (2+ líneas), lo tomo como formulario de póliza/cupón
    if (hasMinLines(message.body, 2)) {
      if (!validateForm("waitingDataPoliza", message.body)) {
        return message.reply("⚠️ Por favor, envíe los datos en el formato correcto.\n\nEjemplo:\n123456789\nJuan Pérez - 12345678");
      }
      sessions[userId] = null;
      return message.reply("✅ Recibido, en instantes tendrá su respuesta.");
    }

    // Nada válido en submenú
    return message.reply(menu.default);
  }

  // ---- CAPTURA DE DATOS (todas las opciones que piden info) ----
  if (currentSession?.startsWith("waitingData")) {
    if (!validateForm(currentSession, message.body)) {
      return message.reply("⚠️ Por favor, envíe los datos en el formato correcto.");
    }
    sessions[userId] = null; // volvemos al menú principal
    return message.reply("✅ Recibido, en instantes tendrá su respuesta.");
  }

  // Fallback
  return message.reply(menu.default);
};

export { handleMessage };
