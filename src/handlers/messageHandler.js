import { changeUserData, getSession } from "../services/sessionsService.js";
import { hasBeenLongEnough, isAnOldMessage } from "../utils/toolkit.js";
import { getProvinciaToken, cotizarVehiculo } from "../cotizaciones/provinciaService.js"; // tu servicio de prueba

const sessions = {}

const hasMinLines = (text, n) =>
  text.split("\n").map(l => l.trim()).filter(Boolean).length >= n;

const includesAny = (text, arr) =>
  arr.some(k => text.includes(k));

const validateForm = (session, rawText, message) => {
  const isWhatsAppLocation =
    message.location &&
    message.location.latitude &&
    message.location.longitude;

  const isPhoto =
    message.hasMedia || message.type === "image";

  const ok = {
    waitingDataPoliza: hasMinLines(rawText, 2),
    waitingDataGenerico: hasMinLines(rawText, 2),
    waitingDataCotizacion: hasMinLines(rawText, 4),
    waitingDataUbicacion: !!isWhatsAppLocation,
    waitingDataDenuncia: hasMinLines(rawText, 2),
    waitingFotos: !!isPhoto,
  };
  return ok[session] ?? false;
};

// --- Función para formatear la cotización de prueba ---
const extraerDatosSinEtiquetas = (texto) => {
  const lineas = texto.split(/\r?\n/).filter(linea => linea.trim() !== '');

  return {
    nombre: lineas[0] || null,
    dni: lineas[1] || null,
    auto: lineas[2] || null,
    ciudad: lineas[3] || null
  };
}

const formatCotizacion = (data, nombre) => {
  let msg = `📅 Fecha: ${data.fechaCotizacion}\n🆔 Nº Cotización: ${data.numeroCotizacion}\n\n`;
  msg += `${nombre} \n`;
  msg += `🚗 Bienes Cotizados:\n`;
  data.bienesCotizados.forEach(b => {
    msg += `- ${b.bien} | Suma Asegurada: $${b.sumaAsegurada}\n`;
  });
  msg += `\n📝 Planes:\n`;
  data.planes.forEach(p => {
    msg += `Plan ${p.plan}: ${p.descripcion}`;
    if (p.descripcionAdicional) msg += ` - ${p.descripcionAdicional}`;
    msg += `\n`;
    p.promocionesPorPlan.forEach(prom => {
      msg += `  * ${prom.descripcion} | Premio: $${prom.premio} | Vigencia: ${prom.vigencia}\n`;
    });
  });
  return msg;
};

const handleMessage = async (message, clientId, config) => {
  const session = await getSession(message, clientId);
  
  //tiempo suficiente ultimo mensaje
  if (hasBeenLongEnough(session.lastMessage, 0.05)) {
    changeUserData(message.from, "botPaused", "false", clientId);
    console.log("Entré a hasBeenLongEnough");
    return message.reply(`Bienvenido/a de nuevo ${session.name}. Envía *menu* para comenzar.`);
  }

  if (isAnOldMessage(message)) return;
  console.log(session.botPaused);
  if (session.botPaused) return;

  const texto = (message.body || "").trim().toLowerCase();
  const menu = config.menu;
  const keywords = config.keywords || {};
  const userId = message.from;

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
        sessions[userId] = "waitingDataCotizacion";
        return message.reply(
          "🚗🏍 Cotización de Vehículo\n\n" +
          "Por favor enviá un solo mensaje con estos 4 datos, **cada uno en una línea**:\n" +
          "1. Nombre y apellido del titular\n" +
          "2. DNI\n" +
          "3. Marca/Modelo/Año\n" +
          "4. Localidad"
        );
      case "2":
      case "denunciar":
        sessions[userId] = "waitingDataDenuncia";
        return message.reply((menu.response2 || "🚨 Denuncia de siniestro") + "\n\n✍️ Enviá los datos solicitados ⚠️");
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
        return message.reply("🚗 Pedido de grúa\n\nEnviá:\n- Nombre y apellido\n- Nº de póliza\n- Patente\n- Destino\n- Teléfono");
      case "6":
        sessions[userId] = "directResponse";
        return message.reply(menu.response6);
      case "7":
        sessions[userId] = "directResponse";
        changeUserData(message.from, "botPaused", "true", clientId);
        console.log("Entré a case 7");
        return message.reply(menu.response7);
      default:
        for (const [responseKey, list] of Object.entries(keywords)) {
          if (list.some(kw => texto.includes(kw))) {
            const titulo = menu[responseKey]?.split("\n")[0] || menu[responseKey];
            return message.reply("Escribe el número de la opción del menú: \n" + titulo);
          }
        }
        return message.reply(menu.default);
    }
  }

  // ---- SUBMENÚ PÓLIZA (3) ----
  if (currentSession === "3") {
    if (texto === "1" || includesAny(texto, ["poliza", "póliza"])) {
      sessions[userId] = "waitingDataPoliza";
      return message.reply((menu.response3_1 || "📑 Para póliza:") + "\n\nN° póliza\nNombre\nDNI");
    }
    if (texto === "2" || includesAny(texto, ["cupon", "cupón"])) {
      sessions[userId] = "waitingDataPoliza";
      return message.reply((menu.response3_2 || "💳 Para cupón:") + "\n\nN° póliza\nNombre\nDNI");
    }
    if (hasMinLines(message.body, 2)) {
      sessions[userId] = null;
      return message.reply("✅ Recibido, en instantes tendrá su respuesta.");
    }
    return message.reply(menu.default);
  }

  // ---- RESPUESTAS DIRECTAS ----
  if (currentSession === "directResponse") {
    sessions[userId] = null;
    return message.reply("✅ Recibida su consulta.");
  }

  // ---- CAPTURA DE FORMULARIOS COTIZACIÓN (4 datos) ----
  if (currentSession === "waitingDataCotizacion") {
    if (!validateForm("waitingDataCotizacion", message.body, message)) {
      return message.reply("⚠️ Por favor enviá los 4 datos en **un solo mensaje**, cada uno en una línea.");
    }

    try {
      const datosUsuarios = extraerDatosSinEtiquetas(message.body);
      const token = await getProvinciaToken();
      const data = await cotizarVehiculo(token, datosUsuarios); // mantiene tu consola de prueba

      sessions[userId] = null;

      // --- Devuelve la cotización formateada en WhatsApp ---
      if (data) {
        const formattedMsg = formatCotizacion(data, datosUsuarios.nombre);
        return message.reply(formattedMsg);
      } else {
        return message.reply("⚠️ Error al generar la cotización de prueba.");
      }

    } catch (err) {
      console.error("❌ Error en cotización:", err.message);
      sessions[userId] = null;
      return message.reply("⚠️ No se pudo generar la cotización en este momento. Intentalo más tarde.");
    }
  }

  // ---- CAPTURA DE DATOS PARA GRÚA ----
  if (currentSession === "waitingDataDatosGrua") {
    if (!hasMinLines(message.body, 5)) {
      return message.reply("⚠️ Enviá todos los datos (5 líneas).");
    }
    sessions[userId] = "waitingDataUbicacion";
    return message.reply("📍 Ahora envía tu ubicación desde WhatsApp.");
  }

  if (currentSession === "waitingDataUbicacion") {
    if (!validateForm("waitingDataUbicacion", message.body, message)) {
      return message.reply("⚠️ Enviá tu ubicación desde WhatsApp.");
    }
    sessions[userId] = null;
    return message.reply("✅ Ubicación recibida, en instantes tendrá tu respuesta.");
  }

  // ---- DENUNCIA ----
  if (currentSession === "waitingDataDenuncia") {
    if (!validateForm("waitingDataDenuncia", message.body, message)) {
      return message.reply("⚠️ Datos incompletos. Reintentá.");
    }
    sessions[userId] = "waitingFotos";
    sessions[userId + "_fotos"] = [];
    return message.reply("✅ Recibido.\n📷 Ahora enviá hasta 5 fotos del daño. Escribí *listo* al terminar.");
  }

  if (currentSession === "waitingFotos") {
    if (!message.hasMedia && message.type !== "image") {
      if (texto === "listo") {
        sessions[userId] = null;
        delete sessions[userId + "_fotos"];
        return message.reply("✅ Fotos recibidas. En instantes tendrás su respuesta.");
      }
      return message.reply("⚠️ Enviá una foto 📷 o escribí *listo*.");
    }
    if (!sessions[userId + "_fotos"]) sessions[userId + "_fotos"] = [];
    sessions[userId + "_fotos"].push({ hasMedia: true, ts: Date.now() });

    if (sessions[userId + "_fotos"].length >= 5) {
      sessions[userId] = null;
      delete sessions[userId + "_fotos"];
      return message.reply("✅ Recibidas todas las fotos.");
    }
    return message.reply(`📸 Foto recibida (${sessions[userId + "_fotos"].length}/5). Podés enviar más o escribir *listo*.`);
  }

  return message.reply(menu.default);
};

export { handleMessage };
