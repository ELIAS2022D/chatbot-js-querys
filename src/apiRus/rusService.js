// rusService.js
import fetch from "node-fetch";
import { obtenerTokenRUS } from "./obtencionTokenRus.js";
import dotenv from "dotenv";

dotenv.config();
const BASE_URL = process.env.RUS_BASE_URL_TEST;
const API_KEY = process.env.RUS_API_KEY_TEST;

export async function descargarPolizaCompletaRUS(numPoliza) {
  // Obtener token antes de la llamada
  const token = await obtenerTokenRUS();
  if (!token) throw new Error("No se pudo obtener token RUS.");

  const codRamo = 4; // fijo según tu necesidad
  const url = `${BASE_URL}/documentos/poliza-completa/${codRamo}/${numPoliza}`;
  console.log(`📡 GET → ${url}`);

  const pdfResp = await fetch(url, {
    method: "GET",
    headers: {
      "x-api-key": API_KEY,
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!pdfResp.ok) {
    const errText = await pdfResp.text();
    throw new Error(`Error al descargar póliza completa: ${pdfResp.status} ${errText}`);
  }

  // --- 🔥 clave: verificar si devuelve PDF crudo o Base64 ---
  const contentType = pdfResp.headers.get("content-type");

  if (contentType && contentType.includes("application/pdf")) {
    // 🟢 Devuelve bytes del PDF directamente
    const arrayBuffer = await pdfResp.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } else {
    // 🟡 Algunos endpoints devuelven JSON con el PDF en base64
    const data = await pdfResp.json();
    if (data?.archivoBase64) {
      return Buffer.from(data.archivoBase64, "base64");
    }
    throw new Error("Respuesta inválida: no se detectó PDF ni archivoBase64");
  }
}