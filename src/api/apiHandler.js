// apiHandler.js
import fs from "fs";
import { descargarPolizaCompletaRUS } from "../apiRus/rusService.js";

export const handleApiCall = async (apiName, inputData) => {
  switch (apiName) {
    case "consultaAPI": {
      try {
        const rutaArchivo = await descargarPolizaCompletaRUS(
          4,
          inputData.numPoliza,
          ""
        );

        // 🔹 Verificamos que el archivo exista
        if (!fs.existsSync(rutaArchivo)) {
          throw new Error("No se generó el archivo PDF");
        }

        // ✅ Devolvemos un objeto con texto y path del PDF
        return {
          message: `📄 Tu póliza *${inputData.numPoliza}* fue descargada correctamente ✅`,
          filePath: rutaArchivo,
        };
      } catch (err) {
        console.error("❌ Error al consultar póliza:", err.message);
        return {
          message: `⚠ No se pudo descargar la póliza: ${err.message}`,
        };
      }
    }

    case "cotizacion":
      return {
        message: `💰 Cotización generada:\n\nAuto: ${inputData.modelo}\nValor: $${inputData.valor}`,
      };

    default:
      return {
        message: `⚠ No se encontró una acción para *${apiName}*`,
      };
  }
};
