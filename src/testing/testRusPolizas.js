import { descargarPolizaCompletaRUS } from "../apiRus/rusService.js";
import dotenv from "dotenv";
dotenv.config();

(async () => {
  try {
    const codRamo = 4;
    const numPoliza = 12694319; // ejemplo, puede no estar autorizado en sandbox
    const output = "./descargas/poliza_test.pdf";

    await descargarPolizaCompletaRUS(codRamo, numPoliza, "", output);
  } catch (error) {
    console.error("❌ Error en la prueba:", error.message);
  }
})();