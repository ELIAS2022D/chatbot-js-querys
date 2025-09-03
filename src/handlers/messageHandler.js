import { getSession } from "../services/sessionsService.js";
import { hasBeenLongEnough } from "../utils/hasBeenLongEnough.js"

const sessions = {}; // Estado de usuarios en memoria (submenús activos)

// --- Helpers ---
const hasMinLines = (text, n) =>
  text.split("\n").map(l => l.trim()).filter(Boolean).length >= n;

const includesAny = (text, arr) =>
  arr.some(k => text.includes(k));

// Validación de formularios según la opción
const validateForm = (session, rawText, message) => {
  const isWhatsAppLocation =
    message.location &&
    message.location.latitude &&
    message.location.longitude;

  const isPhoto =
    message.hasMedia || message.type === "image";

  const ok = {
    waitingDataPoliza: hasMinLines(rawText, 2),      // póliza + Nombre/DNI
    waitingDataGenerico: hasMinLines(rawText, 2),    // genérico
    waitingDataCotizacion: hasMinLines(rawText, 4),  // auto/moto/hogar: 4+ líneas
    waitingDataUbicacion: !!isWhatsAppLocation,      // SOLO ubicación de WhatsApp
    waitingDataDenuncia: hasMinLines(rawText, 2),    // datos mínimos (antes de fotos)
    waitingFotos: !!isPhoto,                         // fotos de denuncia
  };
  return ok[session] ?? false;
};

const handleMessage = async (message, clientId, config) => {
  // --- Verificar antigüedad del mensaje ---
  const msgTimestamp = message.timestamp * 1000; // convertir a milisegundos
  const now = Date.now();
  const diffMinutes = (now - msgTimestamp) / 1000 / 60;

  if (diffMinutes > 10) {
    console.log("Mensaje viejo:", diffMinutes.toFixed(1), "minutos");
    return; // no responde
  }

  const texto = (message.body || "").trim().toLowerCase();
  const menu = config.menu;
  const keywords = config.keywords || {};
  const userId = message.from;
  
  const session = await getSession(message, clientId);
  
  // console.log(JSON.stringify(session, null, 2)); // Para ver el formato de los datos

  //Reviso si pasó mas de 1 hora desde el ultimo mensaje
  if (hasBeenLongEnough(session.lastMessage, 0.05)){
    return message.reply(`Bienvenido/a de nuevo ${session.name}. Envía *menu* para comenzar.`)
  }
  
  //Necesitamos guardar y evaluar la hora del ultimo mensaje para saber si hay que mandarle el menú o simplemente devolverle el default
  //Lo mejor sería no tener que depender de un menu configurado de forma estática sino generar menú de forma flexible según la cantidad de menus y mensajes disponibles por clientes

  if (texto === "hola" || texto === "menu") {
    sessions[userId] = null;
    return message.reply(menu.welcome);
  }

  const currentSession = sessions[userId];

  // ---- MENÚ PRINCIPAL ----
  if (!currentSession) {
    switch (texto) {
      case "1":
      case "cotizacion":
        sessions[userId] = "1";
        return message.reply(menu.response1);

      case "2":
      case "denunciar":
        sessions[userId] = "waitingDataDenuncia";
        return message.reply(
          (menu.response2 || "🚨 Denuncia de siniestro") +
          "\n\n✍️ Por favor, envíe todos los datos solicitados ⚠️"
        );

      case "3":
      case "poliza":
      case "póliza":
      case "cupon":
      case "cupón":
        sessions[userId] = "3";
        return message.reply(menu.response3);

      case "4":
      case "anulacion":
      case "anulación":
        sessions[userId] = "waitingDataGenerico";
        return message.reply(menu.response4);

      case "5":
      case "grua":
      case "grúa":
        sessions[userId] = "waitingDataDatosGrua";
        return message.reply(
          "🚗 Pedido de grúa\n\nEnviá los datos:\n- Nombre y apellido\n- Nº de póliza\n- Patente\n- Destino al que debe trasladarse\n- Teléfono de contacto"
        );

      case "6":
      case "consultas":
      case "consulta":
        sessions[userId] = "directResponse";
        return message.reply(menu.response6);

      case "7":
      case "asesor":
        sessions[userId] = "directResponse";
        return message.reply(menu.response7);

      default:
        for (const [responseKey, list] of Object.entries(keywords)) {
          if (list.some(kw => texto.includes(kw))) {
          // solo traigo la primera línea (el título)
          const titulo = menu[responseKey]?.split("\n")[0] || menu[responseKey];
          return message.reply("Escribe el número de la opción del menú y pide: \n" + titulo);
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
          "\n\n✍️ Enviá los datos (una línea por ítem)"
        );
      case "2":
        sessions[userId] = "waitingDataCotizacion";
        return message.reply(
          (menu.response1_2 || "") +
          "\n\n✍️ Enviá los datos (una línea por ítem)"
        );
      case "3":
        sessions[userId] = "waitingDataCotizacion";
        return message.reply(
          (menu.response1_3 || "") +
          "\n\n✍️ Enviá los datos (una línea por ítem)"
        );
      default:
        return message.reply(menu.default);
    }
  }

  // ---- SUBMENÚ PÓLIZA/CUPÓN (3) ----
  if (currentSession === "3") {
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

    if (hasMinLines(message.body, 2)) {
      if (!validateForm("waitingDataPoliza", message.body, message)) {
        return message.reply("⚠️ Por favor, envíe los datos en el formato correcto.\n\nEjemplo:\n123456789\nJuan Pérez - 12345678");
      }
      sessions[userId] = null;
      return message.reply("✅ Recibido, en instantes tendrá su respuesta.");
    }

    return message.reply(menu.default);
  }

  // ---- OPCIONES 6 y 7 (RESPUESTA DIRECTA) ----
  if (currentSession === "directResponse") {
    sessions[userId] = null;
    return message.reply("✅ Recibida su respuesta.");
  }

  // ---- CAPTURA DE DATOS + FOTOS + UBICACIÓN ----
  // Abarca: waitingData*, waitingFotos
  if (currentSession?.startsWith?.("waitingData") || currentSession === "waitingFotos") {

    // 🚗 Pedido de grúa: primero datos, luego ubicación
    if (currentSession === "waitingDataDatosGrua") {
      if (!hasMinLines(message.body, 5)) {
        return message.reply("⚠️ Por favor, envíe todos los datos solicitados (5 líneas).");
      }
      sessions[userId] = "waitingDataUbicacion";
      return message.reply("📍 Ahora envíe su ubicación en WhatsApp.");
    }

    // 📍 Ubicación para grúa
    if (currentSession === "waitingDataUbicacion") {
      if (!validateForm("waitingDataUbicacion", message.body, message)) {
        return message.reply("⚠️ Por favor, envíe su ubicación 📍 desde WhatsApp.");
      }
      sessions[userId] = null;
      return message.reply("✅ Ubicación recibida, en instantes tendrá su respuesta.");
    }

    // 🚨 Denuncia de siniestro: datos primero → recibido → luego fotos
    if (currentSession === "waitingDataDenuncia") {
      if (!validateForm("waitingDataDenuncia", message.body, message)) {
        return message.reply("⚠️ Por favor, envíe los datos en el formato correcto.");
      }
      sessions[userId] = "waitingFotos";
      sessions[userId + "_fotos"] = [];
      return message.reply("✅ Recibido.\n\n📷 Ahora enviá hasta 5 fotos del daño (una por mensaje). Escribí *listo* cuando termines.");
    }

    // 📸 Captura de fotos (máx. 5) para denuncia
    if (currentSession === "waitingFotos") {
      // Permitir finalizar sin adjuntar una foto en este mensaje
      if (!message.hasMedia && message.type !== "image") {
        if (texto === "listo") {
          sessions[userId] = null;
          delete sessions[userId + "_fotos"];
          return message.reply("✅ Recibidas las fotos. En instantes tendrás tu respuesta.");
        }
        return message.reply("⚠️ Enviá una foto 📷 o escribí 'listo' para terminar.");
      }

      // Guardar referencia de la foto (si querés, acá podés descargarla con await message.downloadMedia())
      if (!sessions[userId + "_fotos"]) {
        sessions[userId + "_fotos"] = [];
      }
      sessions[userId + "_fotos"].push({ hasMedia: true, ts: Date.now() });

      if (sessions[userId + "_fotos"].length >= 5) {
        sessions[userId] = null;
        delete sessions[userId + "_fotos"];
        return message.reply("✅ Recibidas todas las fotos. En instantes tendrás tu respuesta.");
      }

      return message.reply(
        `📸 Foto recibida (${sessions[userId + "_fotos"].length}/5). Podés enviar más o escribir "listo" para terminar.`
      );
    }

    // Resto de formularios
    if (!validateForm(currentSession, message.body, message)) {
      return message.reply("⚠️ Por favor, envíe los datos en el formato correcto.");
    }

    sessions[userId] = null;
    return message.reply("✅ Recibido, en instantes tendrá su respuesta.");
  }

  return message.reply(menu.default);
};

export { handleMessage };
