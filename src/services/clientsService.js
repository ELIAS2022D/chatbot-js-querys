import redisClient from "../db/redisClient.js";

//🔧 hSet = datos que cambian seguido, como una tabla
//📦 set = objetos completos, como una caja cerrada ⬅️ EN ESTE CASO

//-------------- ❇️ FUNCIONES PARA CREAR y OBTENER CLIENTES ❇️ ---------------------

// 📝🆕➕ Crear cliente
const createClient = async (clientId, clientName) => {
  const newClient = {
    // id: lastId, AQUÍ IMPLEMENTAREMOS EL ULTIMO ID DISPONIBLE
    name: clientName,
    mail: mail,
    menu: {
      welcome: "Hola! Esta es la bienvenida default!",
      default:
        "Este es el mensaje que se mostrará cuando lo que se recibió no coincide con ninguna opción válida.",
    },
    keywords: {},
    active: true,
  };

  await redisClient.set(`client:${clientId}`, JSON.stringify(newClient));
  return newClient;
};

// 🔍❓ Verificar si existe cliente
const clientExist = async (clientId) => {
  const raw = await redisClient.get(`client:${clientId}`);
  return !!raw;
};

// ↪️👨🏻‍💼💼 Traer un cliente
const getClient = async (clientId) => {
  try {
    const raw = await redisClient.get(`client:${clientId}`);
    if (!raw) {
      const client = await createClient(clientId, "Cliente sin nombre");
      return client;
    }

    return JSON.parse(raw);
  } catch (error) {
    console.error("Error al obtener cliente:", error);
    return null;
  }
};

// ↪️👨🏻‍💼💼📚 Traer todos los clientes
const getAllClients = async () => {
  const keys = await redisClient.keys("client:*");
  const clients = [];

  for (const key of keys) {
    const raw = await redisClient.get(key);
    if (raw) {
      const clientConfig = JSON.parse(raw);
      clients.push(clientConfig);
    }
  }

  return clients;
};

//-------------- ❇️ FUNCIONES PARA HACER ACCIONES CON UN CLIENTE ❇️ ---------------------

/**
 * 📝🔀👨🏻‍💼💼 Cambiar un dato del cliente (Función madre)
 * Esta función permite modificar cualquier campo del objeto cliente,
 * incluyendo campos anidados como "menu.welcome" o "keywords.cotizar".
 *
 * 📌 Casos de uso:
 * - changeClientData("cliente1", "name", "Nuevo nombre")
 * - changeClientData("cliente1", "menu.welcome", "¡Bienvenido!")
 * - changeClientData("cliente1", "keywords.ayuda", ["ayuda", "soporte", "3"])
 * - changeClientData("cliente1", "menu.options.contacto", "Podés llamarnos al 0800...")
 */
const changeClientData = async (clientId, path, value) => {
  try {
    const raw = await redisClient.get(`client:${clientId}`);
    if (!raw) return;

    const client = JSON.parse(raw);

    // 🧠 Navegamos el path tipo "menu.welcome"
    const keys = path.split(".");
    let current = client;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key]) current[key] = {}; // crea si no existe
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;

    await redisClient.set(`client:${clientId}`, JSON.stringify(client));
  } catch (error) {
    console.error("Error al cambiar el dato del cliente:", error);
  }
};

export {
  createClient,
  clientExist,
  getClient,
  getAllClients,
  changeClientData,
};
