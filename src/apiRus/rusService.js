// rusService.js
import fs from 'fs';
import fetch from 'node-fetch';
import { obtenerTokenRUS } from './obtencionTokenRus.js';
import dotenv from 'dotenv';

dotenv.config();
const BASE_URL = process.env.RUS_BASE_URL_TEST;
const API_KEY = process.env.RUS_API_KEY_TEST;

export async function descargarPolizaCompletaRUS(
  codRamo = 4, // fijo según tu necesidad
  numPoliza = "12694319",
  endoso = ''
) {
  // Obtener token antes de la llamada
  const token = await obtenerTokenRUS();
  if (!token) throw new Error('No se pudo obtener token RUS.');

  const url = `${BASE_URL}/documentos/poliza-completa/${codRamo}/${numPoliza}`;
  console.log(`📡 GET → ${url}`);

  const pdfResp = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!pdfResp.ok) {
    const errText = await pdfResp.text();
    throw new Error(`Error al descargar póliza completa: ${pdfResp.status} ${errText}`);
  }

  const arrayBuf = await pdfResp.arrayBuffer();
  console.log(arrayBuf);
  // fs.writeFileSync(outputPath, Buffer.from(arrayBuf));

  return `✅ Póliza completa descargada.`;
}