import { saveClientMenu, saveClientBannedNumbers } from "../services/clientsService.js";


export const handleAdminMenu = async (message, clientName, clientData) => {
  const text = message.body.trim().toLowerCase();
  const menu = clientData.menu;

  // === MENÚ PRINCIPAL DEL ADMIN ===
  if (text === "admin") {
    const adminName = clientData.name;

    const editable =
      `Bienvenido Admin de *${adminName}* 🛠\n` +
      `Aquí tiene sus opciones disponibles para su edición:\n\n` +

      "1️⃣ *Cambiar bienvenida*\n" +
      "   ➤ escribir: cambiar bienvenida a: *TU_TEXTO*\n\n" +

      "2️⃣ *Cambiar la respuesta de una opción*\n" +
      "   ➤ escribir: cambiar respuesta de 'NOMBRE_OPCION' a: *TU_TEXTO*\n\n" +

      "3️⃣ *Cambiar texto principal del menú de una opción*\n" +
      "   ➤ escribir: cambiar hint de 'NOMBRE_OPCION' a: *TU_TEXTO*\n\n" +

      "4️⃣ *Cambiar respuesta de submenú*\n" +
      "   ➤ escribir: cambiar texto de 'NOMBRE_OPCION' a: *TU_TEXTO*\n\n" +

      "5️⃣ *Administrar números bloqueados*\n" +
      "   ➤ ver baneados\n" +
      "   ➤ banear *TU_NUMERO*\n" +
      "   ➤ desbanear *TU_NUMERO*\n";

    return message.reply(editable);
  }

  // === 1. CAMBIAR BIENVENIDA ===
  if (text.startsWith("cambiar bienvenida a:")) {
    const newWelcome = message.body.split(":")[1].trim();
    menu.welcome = newWelcome;

    await saveClientMenu(clientName, menu);
    clientData.menu = menu;

    return message.reply("✅ La bienvenida fue actualizada.");
  }

  // === 2. CAMBIAR RESPUESTA DE UNA OPCIÓN ===
  if (text.startsWith("cambiar respuesta de")) {
    const optionName = text.split("cambiar respuesta de")[1]
      .split("a:")[0]
      .trim()
      .replace(/['"]/g, "");

    const newResponse = message.body.split("a:")[1].trim();

    if (!menu.options[optionName]) {
      return message.reply(`⚠ La opción '${optionName}' no existe.`);
    }

    menu.options[optionName].response = newResponse;

    await saveClientMenu(clientName, menu);
    clientData.menu = menu;

    return message.reply(`✅ La respuesta de '${optionName}' fue actualizada.`);
  }

  // === 3. CAMBIAR HINT ===
  if (text.startsWith("cambiar hint de")) {
    const optionName = text.split("cambiar hint de")[1]
      .split("a:")[0]
      .trim()
      .replace(/['"]/g, "");

    const newHint = message.body.split("a:")[1].trim();

    if (!menu.options[optionName]) {
      return message.reply(`⚠ La opción '${optionName}' no existe.`);
    }

    menu.options[optionName].hint = newHint;

    await saveClientMenu(clientName, menu);
    clientData.menu = menu;

    return message.reply(`✅ El hint de '${optionName}' fue actualizado.`);
  }

  // === 4. CAMBIAR TEXTO DE SUBMENÚ ===
  if (text.startsWith("cambiar texto de")) {
    const optionName = text.split("cambiar texto de")[1]
      .split("a:")[0]
      .trim()
      .replace(/['"]/g, "");

    const newText = message.body.split("a:")[1].trim();

    if (!menu.options[optionName]) {
      return message.reply(`⚠ La opción '${optionName}' no existe.`);
    }

    menu.options[optionName].response = newText;

    await saveClientMenu(clientName, menu);
    clientData.menu = menu;

    return message.reply(`📝 El texto de '${optionName}' fue actualizado.`);
  }

  // === 5. VER BANEADOS ===
  if (text === "ver baneados") {
    const banned = clientData.bannedNumbers || [];

    if (banned.length === 0) {
      return message.reply("📭 No hay números bloqueados.");
    }

    return message.reply(
      "🚫 *Números bloqueados:*\n\n" +
      banned.map(n => `• ${n}`).join("\n")
    );
  }

  // === 6. BANEAR ===
  if (text.startsWith("banear")) {
    const number = text.replace("banear", "").trim();

    if (!number.match(/^\d+$/)) {
      return message.reply("⚠ Debe ingresar solo números. Ejemplo: banear 549113334455");
    }

    const banned = clientData.bannedNumbers || [];

    if (banned.includes(number)) {
      return message.reply("⚠ Ese número ya está bloqueado.");
    }

    banned.push(number);
    clientData.bannedNumbers = banned;

    await saveClientBannedNumbers(clientName, banned);

    return message.reply(`🚫 El número *${number}* fue bloqueado.`);
  }

  // === 7. DESBANEAR ===
  if (text.startsWith("desbanear")) {
    const number = text.replace("desbanear", "").trim();

    const banned = clientData.bannedNumbers || [];

    if (!banned.includes(number)) {
      return message.reply("⚠ Ese número no está bloqueado.");
    }

    const updated = banned.filter(n => n !== number);
    clientData.bannedNumbers = updated;

    await saveClientBannedNumbers(clientName, updated);

    return message.reply(`✅ El número *${number}* fue desbloqueado.`);
  }

  // Si no coincide con ningún comando admin
  return null;
};