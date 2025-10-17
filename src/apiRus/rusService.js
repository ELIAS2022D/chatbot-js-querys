// rusService.js
import fetch from "node-fetch";
import dotenv from "dotenv";
import { obtenerTokenRUS } from "./obtencionTokenRus.js";

dotenv.config();

const BASE_URL = process.env.RUS_BASE_URL_TEST;
const API_KEY = process.env.RUS_API_KEY_TEST;

// Lista de productores configurados
const productores = [
  {
    nombre: "kevin",
    user: process.env.RUS_USER_KEVIN_TEST,
    pass: process.env.RUS_PASS_KEVIN_TEST
  },
  {
    nombre: "angel",
    user: process.env.RUS_USER_ANGEL_TEST,
    pass: process.env.RUS_PASS_ANGEL_TEST
  }
];

export async function descargarPolizaCompletaRUS(numPoliza) {
  const codRamo = 4; // fijo para autos u otro ramo según tu negocio
  const urlBase = `${BASE_URL}/documentos/poliza-completa/${codRamo}/${numPoliza}`;

  console.log(`🔄 Buscando productor correcto para póliza ${numPoliza}...`);

  // Probar productor por productor
  for (const productor of productores) {
    try {
      console.log(`➡️ Probando con productor: ${productor.nombre}...`);
      console.log({ user: productor.user, pass: productor.pass });

      // Obtener token por productor
      const token = await obtenerTokenRUS(productor.user, productor.pass);
      if (!token) throw new Error("No se pudo obtener token");

      // Descargar PDF
      const response = await fetch(urlBase, {
        method: "GET",
        headers: {
          "x-api-key": API_KEY,
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errText = await response.text();
        console.log(`❌ ${productor.nombre.toUpperCase()} no válido: ${response.status} ${errText}`);
        continue; // probar siguiente productor
      }

      console.log(`✅ ${productor.nombre.toUpperCase()} válido → póliza encontrada`);

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/pdf")) {
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
      } else {
        const data = await response.json();
        if (data?.archivoBase64) {
          return Buffer.from(data.archivoBase64, "base64");
        }
        throw new Error("Respuesta inválida: no se detectó PDF ni archivoBase64");
      }
    } catch (err) {
      console.log(`⚠ Error con productor ${productor.nombre}: ${err.message}`);
    }
  }

  console.error("🚫 Ningún productor válido para esta póliza.");
  throw new Error("No se pudo descargar la póliza desde ningún productor.");
}