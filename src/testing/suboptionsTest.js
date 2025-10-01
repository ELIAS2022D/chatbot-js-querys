import { getClient } from "../services/clientsService.js";
import redisClient from "../db/redisClient.js";
import dotenv from "dotenv";

dotenv.config();

const user = {
  currentNode: "null",
};

const getNestedValue = (obj, pathString) => {
  const keys = pathString.split(".");
  
  return keys.reduce((acc, key, index) => {
    if (!acc || acc[key] === undefined) return undefined;
    const next = acc[key];
    const isLast = index === keys.length - 1;
    return !isLast && next.type === "submenu" ? next.options : next;
  }, obj);
};

const showOptions = (options) => {
  Object.entries(options).forEach(([key, opt]) => {
    console.log(`🔹 ${key}: ${opt.hint}`);
  });
};

const suboptionsTest = async () => {
  const cliente = await getClient("clienttest");
  console.log("Estamos en el menú principal");
  showOptions(cliente.menu.options);

  const loop = () => {
    process.stdin.once("data", (data) => {
      const message = data.toString().trim();

      if (message === "fin") {
        console.log("👋 Fin del flujo");
        return;
      }

      if (message === "volver") {
        user.currentNode = "null";
        console.log("🔙 Volviendo al menú principal");
        showOptions(cliente.menu.options);
        return loop();
      }

      user.currentNode =
        user.currentNode === "null"
          ? message
          : `${user.currentNode}.${message}`;

      console.log(`currentNode ahora es ${user.currentNode}`);
      const ruta = user.currentNode;
      const suboptions = getNestedValue(cliente.menu.options, ruta);

      if (suboptions?.type === "submenu") {
        console.log("Es submenu");
        showOptions(suboptions.options);
      }

      if (suboptions?.type === "static") {
        console.log("Es static");
        console.log(`📢 ${suboptions.response}`);
      }
      loop(); // 🔁 vuelve a esperar input
    });
  };

  loop();
};

suboptionsTest();
