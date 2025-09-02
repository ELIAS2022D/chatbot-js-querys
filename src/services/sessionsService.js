import { promises as fs } from "fs";
import { fileURLToPath } from "url";
import { formatCellphoneNumber, fileExists } from "../utils/toolkit.js";
import path from "path";

// 🔍 RUTAS ------------------------------------
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Genera la ruta del archivo según el nombre del cliente
const getSessionFilePath = (clientName) =>
  path.join(__dirname, "..", "data", "sessions", `${clientName}.json`);

// 📂 MANEJO DE ARCHIVOS -----------------------
// Crea el archivo con estructura inicial
const createClientSessionFile = async (clientName) => {
  const filePath = getSessionFilePath(clientName);
  const initialData = { users: [] };
  console.log(
    `Creando archivo del cliente ${clientName} en la ruta ${filePath}`
  );
  await fs.writeFile(filePath, JSON.stringify(initialData, null, 2));
};
// Devuelve los datos del archivo
const getAllSessions = async (filePath) => {
  const data = await fs.readFile(filePath, "utf8");
  return JSON.parse(data);
};

// 📝 INFORMACION Y DATOS DE USUARIO ----------------------
// Verifica si el usuario existe
const userExist = (data, cellphone) =>
  data.users.find((user) => user.phone === cellphone); //Si no tiene corchetes significa que tiene un return implicito

// Guarda el último mensaje
const saveLastMessage = async (filePath, data, message) => {
  const cellphone = formatCellphoneNumber(message.from);
  const timeNow = Date.now();
  const user = data.users.find((u) => u.phone === cellphone);
  
  user.lastMessage = timeNow;
  console.log(`Guardando el ultimo mensaje al usuario: ${user}`);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
};
// Crea una nueva sesión de usuario
const createUserSession = async (filePath, data, message) => {
  const cellphone = formatCellphoneNumber(message.from);
  const timeNow = new Date.now();

  const newUser = {
    phone: cellphone,
    lastMessage: timeNow,
  };

  data.users.push(newUser);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  console.log(`El newUser contiene: ${newUser}`);
  return newUser;
};

// 👑 LOGICA DE NEGOCIO PRINCIPAL
// Función principal que devuelve los datos del usuario dentro de la session del cliente
const getSession = async (message, clientId) => {
  const filePath = getSessionFilePath(clientId);

  console.log(`Entrando en getSession. El filePath es ${filePath}`);

  try {
    const exists = await fileExists(filePath);
    if (!exists) {
      await createClientSessionFile(clientId);
    }

    const data = await getAllSessions(filePath);
    const cellphone = formatCellphoneNumber(message.from);

    let user = userExist(data, cellphone);

    if (user) {
      console.log("El usuario existe. Modificando horario de ultimo mensaje")
      await saveLastMessage(filePath, data, message);
    } else {
      console.log("El usuario NO existe. Creando session...")
      user = await createUserSession(filePath, data, message);
    }
  
    // Retorno Session de Usuario
    return user;
  } catch (error) {
    console.error("Error al manejar la sesión:", error);
    return null;
  }
};

export { getSession, createClientSessionFile };
