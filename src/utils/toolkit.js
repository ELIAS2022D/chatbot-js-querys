import readline from "readline";

const waitingConfirmation = (variable = undefined) => {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    if (variable) {
      console.log(variable);
    }

    rl.question("🛑 Presioná Enter para continuar o escribí 's' para saltear este producto...\n", (input) => {
      rl.close();
      if (input.trim().toLowerCase() === 's') {
        reject(new Error("Producto salteado manualmente"));
      } else {
        resolve();
      }
    });
  });
};

// ❔ Verificar si un objeto está vacío
const isEmptyObject = (obj) => Object.keys(obj).length === 0;

const isAnOldMessage = (message) => {
  const msgTimestamp = message.timestamp * 1000;
  const now = Date.now();
  const diffMinutes = (now - msgTimestamp) / 1000 / 60;

  if (diffMinutes > 10) {
    return true;
  } else return false;
};

const hasBeenLongEnough = (lastTimeStamps, hours = 3) => {
  const timeNow = Date.now();

  // Si la diferencia es mayor a las horas establecidas como máximo devuelvo true
  const differenceInHours = (timeNow - lastTimeStamps) / (1000 * 60 * 60);
  return differenceInHours >= hours;
};

const formatCellphoneNumber = (cellphone) => cellphone.slice(0, -5);

export { isEmptyObject, hasBeenLongEnough, formatCellphoneNumber, isAnOldMessage, waitingConfirmation };