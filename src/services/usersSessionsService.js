import fs from "fs";
import path from "path";

const fileExists = async (path) => {
  return fs.promises
    .access(path)
    .then(() => true)
    .catch(() => false);
};

const existUserOnFile = async (path, id) => {
  //Traigo todos los datos de usuario de mi cliente
  const data = await fs.promises.readFile(path, "utf-8");
  //Los transformo de texto a objeto
  const users = JSON.parse(data);
  users.find(user => {user.phone; console.log("Lo encontré");});
}

const existUserSession = async (message, clientId) => {
  const cellphone = formatCellphoneNumber(message);
  const path = `src/data/sessions/${clientId}.json`;

  const exists = await fileExists(path);
  //Si existe el archivo busco el usuario
  if (exists) {
    existUserOnFile(path, cellphone)
  }
};

const createUserSession = (message, clientId) => {};

const formatCellphoneNumber = (message) => {
  return message.from.slice(0, -5);
};

export { existUserSession, createUserSession };
