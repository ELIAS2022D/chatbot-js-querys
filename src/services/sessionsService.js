import {
  formatCellphoneNumber,
  isEmptyObject,
  waitingConfirmation,
} from "../utils/toolkit.js";
import redisClient from "../db/redisClient.js";

//🔧 hSet = datos que cambian seguido, como una tabla ⬅️ EN ESTE CASO
//📦 set = objetos completos, como una caja cerrada

//-------------- ❇️ FUNCIONES PARA CREAR y OBTENER USUARIOS ❇️ ---------------------

// 📝🆕➕ Crear usuario
const createUserSession = async (clientName, message) => {
  const cellphone = formatCellphoneNumber(message.from);
  const timeNow = Date.now();

  await redisClient.hSet(`session:${clientName}:${cellphone}`, {
    phone: cellphone,
    lastMessage: String(timeNow),
    botPaused: String(false),
    currentNode: "null",
  });

  return await redisClient.hGetAll(`session:${clientName}:${cellphone}`);
};

// 🔍❓ Verificar si existe usuario
const userExist = async (clientName, cellphone) => {
  const key = `session:${clientName}:${cellphone}`;
  const data = await redisClient.hGetAll(key);
  return Object.keys(data).length > 0;
};

const parseUserSession = (rawUser) => { //Debemos actualizar esta función para que cargue los key values de forma automatica y no tener que estar haciendolo manualmente
  return {
    phone: rawUser.phone,
    lastMessage: Number(rawUser.lastMessage),
    botPaused: rawUser.botPaused === "true",
    currentNode: rawUser.currentNode,
    inputFlow: rawUser.inputFlow ? JSON.parse(rawUser.inputFlow) : null
  };
};

// ↪️👨🏻 Traer un usuario
const getUserSession = async (clientName, message) => {
  try {
    const cellphone = formatCellphoneNumber(message.from);
    const key = `session:${clientName}:${cellphone}`;

    let user = await redisClient.hGetAll(key);

    if (isEmptyObject(user)) {
      user = await createUserSession(clientName, message);
    } else {
      await saveLastMessage(clientName, message);
    }

    return parseUserSession(user);
  } catch (error) {
    console.error("Error al obtener la sesión:", error);
    return null;
  }
};

// ↪️👨🏻📚 Traer todos los usuarios (Solo para analisis generales)
const getAllUserSessions = async (clientName) => {
  const pattern = `session:${clientName}:*`;
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
const changeUserData = async (clientName, cellphoneRaw, key, value) => {
  try {
    const cellphone = formatCellphoneNumber(cellphoneRaw);
    await redisClient.hSet(
      `session:${clientName}:${cellphone}`,
      key,
      String(value)
    );
  } catch (error) {
    console.error("Error al cambiar el dato del usuario:", error);
  }
};

// 📝📩 Guardar último mensaje
const saveLastMessage = async (clientName, message) => {
  const timeNow = Date.now();
  await changeUserData(clientName, message.from, "lastMessage", timeNow);
};

export {
  isEmptyObject,
  createUserSession,
  userExist,
  getUserSession,
  getAllUserSessions,
  changeUserData,
  saveLastMessage,
};