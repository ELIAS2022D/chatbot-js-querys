import redisClient from "../db/redisClient.js";
import { formatCellphoneNumber } from "../utils/toolkit.js";

export const incrementStats = async (clientName, message, clientData) => {
  const key = `stats:${clientName}`;

  const user = formatCellphoneNumber(message.from);
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // Total de mensajes
  await redisClient.hIncrBy(key, "totalMessages", 1);

  // Mensajes del día
  await redisClient.hIncrBy(key, `messages:${today}`, 1);

  // Usuarios únicos
  await redisClient.sAdd(`${key}:users`, user);

  // Contador de uso de opciones (si coincidió con algún hint o keyword)
  const normalized = message.body.toLowerCase().trim();
  const menu = clientData.menu.options;
  for (const optName of Object.keys(menu)) {
    const hint = menu[optName].hint?.toLowerCase() || "";
    if (hint.includes(normalized) || normalized.includes(optName)) {
      await redisClient.hIncrBy(`${key}:usage`, optName, 1);
    }
  }
};

// Obtener estadísticas
export const getStats = async (clientName, clientData) => {
  const key = `stats:${clientName}`;
  const today = new Date().toISOString().slice(0, 10);

  const totalMessages = await redisClient.hGet(key, "totalMessages");
  const todayMessages = await redisClient.hGet(key, `messages:${today}`);
  const uniqueUsers = await redisClient.sCard(`${key}:users`);

  const bannedCount = (clientData.bannedNumbers || []).length;

  const usage = await redisClient.hGetAll(`${key}:usage`);

  return {
    totalMessages: totalMessages || 0,
    todayMessages: todayMessages || 0,
    uniqueUsers: uniqueUsers || 0,
    bannedCount,
    usage,
  };
};