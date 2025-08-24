import fs from "fs";
import path from "path";

const existUserSession = async (message, clientId) => {
  const cellphone = formatCellphoneNumber(message);
  const path = `src/data/sessions/${clientId}.json`;
  console.log(path);

  //Existe el archivo donde se guardan las user Sessions?
  try {
    await fs.promises.access(path);
    console.log("true");
    return true;
  } catch {
    console.log("false");
    return false;
  }
};

const createUserSession = (message, clientId) => {};

const formatCellphoneNumber = (message) => {
  return message.from.slice(0, -5);
};

export { existUserSession, createUserSession };
