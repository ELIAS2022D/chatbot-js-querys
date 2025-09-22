import { formatCellphoneNumber } from "../utils/toolkit.js";
import redisClient from "../db/redisClient.js";

//-------------- ❇️ FUNCIONES PARA CREAR y OBTENER USUARIOS ❇️ ---------------------

// ❔ Verificar si un objeto está vacío
const isEmptyObject = (obj) => Object.keys(obj).length === 0;

// 📝🆕➕ Crear usuario
const createUserSession = async (clientId, message) => {
  const cellphone = formatCellphoneNumber(message.from);
  const timeNow = Date.now();

  const newUserSession = {
    phone: cellphone,
    lastMessage: timeNow,
    botPaused: false,
  };

  await redisClient.hSet(`session:${clientId}:${cellphone}`, newUserSession);

  return newUserSession;
};

// 🔍❓ Verificar si existe usuario
const userExist = async (clientId, cellphone) => {
  const key = `session:${clientId}:${cellphone}`;
  const data = await redisClient.hGetAll(key);
  return Object.keys(data).length > 0;
};

// ↪️👨🏻 Traer un usuario
const getUserSession = async (clientId, message) => {
  try {
    const cellphone = formatCellphoneNumber(message.from);
    const key = `session:${clientId}:${cellphone}`;
    let user = await redisClient.hGetAll(key);

    if (isEmptyObject(user)) {
      user = await createUserSession(clientId, message);
    }

    await saveLastMessage(clientId, message);

    return user;
  } catch (error) {
    console.error("Error al obtener la sesión:", error);
    return null;
  }
};

// ↪️👨🏻📚 Traer todos los usuarios (Solo para analisis generales)
const getAllUserSessions = async (clientId) => {
  const pattern = `session:${clientId}:*`;
  const keys = await redisClient.keys(pattern);

  const users = [];

  for (const key of keys) {
    const data = await redisClient.hGetAll(key);
    if (Object.keys(data).length > 0) {
      users.push(data);
    }
  }

  return users;
};

//-------------- ❇️ FUNCIONES PARA HACER ACCIONES CON UN USUARIO ❇️ ---------------------

// 📝🔀👨🏻 Cambiar un dato del usuario (Funcion Madre)
const changeUserData = async (clientId, cellphoneRaw, key, value) => {
  try {
    const cellphone = formatCellphoneNumber(cellphoneRaw);
    await redisClient.hSet(`session:${clientId}:${cellphone}`, key, value);
  } catch (error) {
    console.error("Error al cambiar el dato del usuario:", error);
  }
};

// 📝📩 Guardar último mensaje
const saveLastMessage = async (clientId, message) => {
  const timeNow = Date.now();
  await changeUserData(clientId, message.from, "lastMessage", timeNow);
};


export { getUserSession, changeUserData };
