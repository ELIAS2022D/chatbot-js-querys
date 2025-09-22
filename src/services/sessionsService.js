import { formatCellphoneNumber } from "../utils/toolkit.js";
import redisClient from "../db/redisClient.js";

// 🔑 Helpers para Redis -----------------------
const getSessionKey = (clientName) => `session:${clientName}`; // funcion entrada que le pasa a redis para guardarlo bajo keys.

// Obtener todas las sesiones de un cliente
const getAllSessions = async (clientName) => {
  const key = getSessionKey(clientName);
  const data = await redisClient.get(key);
  return data ? JSON.parse(data) : null;
};

// Crear estructura inicial para un cliente
const createClientSession = async (clientName) => {
  const key = getSessionKey(clientName);
  const initialData = { users: [] }; // Setea vacío para pasarle datos automaticamente.
  await redisClient.set(key, JSON.stringify(initialData));
  return initialData;
};

// Guardar todas las sesiones de un cliente
const saveSessions = async (clientName, data) => {
  const key = getSessionKey(clientName);
  await redisClient.set(key, JSON.stringify(data));
};

// 🔍 Buscar usuario dentro de la data
const userExist = (data, cellphone) =>
  data.users.find((user) => user.phone === cellphone);

// 📝 Guardar último mensaje
const saveLastMessage = async (clientName, message) => {
  const cellphone = formatCellphoneNumber(message.from);
  const timeNow = Date.now();
};

// Crear nueva sesión de usuario
const createUserSession = async (clientName, message) => {
  const cellphone = formatCellphoneNumber(message.from);
  const timeNow = Date.now();

  const newUserSession = {
    phone: cellphone,
    lastMessage: timeNow,
    botPaused: false,
  };

  await redisClient.hSet(`session:${clientName}:${cellphone}`, newUserSession);

  return newUserSession;
};

const isEmptyObject = (obj) => Object.keys(obj).length === 0;

// Lógica que trae datos de usuario
const getUserSession = async (message, clientId) => {
  try {
    const cellphone = formatCellphoneNumber(message.from);
    const key = `session:${clientId}:${cellphone}`;
    let user = await redisClient.hGetAll(key);

    if (isEmptyObject(user)) {
      user = await createUserSession(clientId, message);
    }

    await saveLastMessage(clientId, user, message);

    return user;
  } catch (error) {
    console.error("Error al manejar la sesión:", error);
    return null;
  }
};

// Cambiar un dato del usuario
const changeUserData = async (cellphoneRaw, key, value, clientId) => {
  try {
    const cellphone = formatCellphoneNumber(cellphoneRaw);
    const data = await getAllSessions(clientId);

    // 🟥 REDIS GUARDAR UN DATO DEL USUARIO
    await redisClient.hSet(
      `session:${clientName}:${cellphone}`,
      "lastMessage",
      timeNow
    );

    if (!data) return;

    const user = userExist(data, cellphone);
    if (!user) return;

    if (!(key in user)) {
      console.log(`La clave "${key}" no existe en el usuario.`);
      return;
    }

    user[key] = value;
    await saveSessions(clientId, data);
  } catch (error) {
    console.log(error);
  }
};

export { getSession, createClientSession, changeUserData };
