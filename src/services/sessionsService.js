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
const saveLastMessage = async (clientName, data, message) => {
  const cellphone = formatCellphoneNumber(message.from);
  const timeNow = Date.now();
  const user = data.users.find((u) => u.phone === cellphone);

  user.lastMessage = timeNow;
  await saveSessions(clientName, data);
};

// Crear nueva sesión de usuario
const createUserSession = async (clientName, data, message) => {
  const cellphone = formatCellphoneNumber(message.from);
  const timeNow = Date.now();

  // formato para agregar usuario
  const newUser = {
    phone: cellphone,
    lastMessage: timeNow,
    botPaused: false,
  };

  data.users.push(newUser);
  await saveSessions(clientName, data);
  return newUser;
};

// 👑 LOGICA DE NEGOCIO PRINCIPAL
//Cambiar adaptacion en lugar de trabajar todas las sesiones, trabajar con un usuario particular.
const getSession = async (message, clientId) => {
  try {
    let data = await getAllSessions(clientId);

    if (!data) {
      data = await createClientSession(clientId);
    }

    const cellphone = formatCellphoneNumber(message.from);
    let user = userExist(data, cellphone);

    if (user) {
      await saveLastMessage(clientId, data, message);
    } else {
      user = await createUserSession(clientId, data, message);
    }

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
