import { descargarPolizaCompletaRUS } from "../apiRus/rusService.js";
import dotenv from "dotenv";
dotenv.config();

(async () => {
  try {
    const numPoliza = 12694319; // ejemplo, puede no estar autorizado en sandbox

    await descargarPolizaCompletaRUS(numPoliza);
  } catch (error) {
    console.error("❌ Error en la prueba:", error.message);
  }
})();