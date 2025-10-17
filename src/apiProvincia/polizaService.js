// ---------------------------------------------------------
// 📄 Servicio de descarga de Póliza (Provincia Seguros)
// ---------------------------------------------------------
// Este módulo intenta obtener la póliza en PDF de una póliza específica.
// Prueba automáticamente los tokens de los tres productores configurados
// y devuelve el PDF del primero que tenga acceso autorizado.
// ---------------------------------------------------------

import fetch from 'node-fetch';
import { obtenerTokenProductor } from './provinciaService.js';

// Endpoint oficial (usar PROD o TEST según necesidad)
const API_URL = 'https://apimprod.provinciaseguros.com.ar/PS/PS-NOVEDADES/3.0';
const API_KEY = '84630d93-d8c2-40b3-ad3d-b82773c092b5';

/**
 * Intenta descargar la póliza con cada productor hasta que uno funcione.
 * @param {Object} numPoliza
 * @param {string} numPoliza.poliza
 * @returns {Promise<Buffer>} PDF de la póliza si se encuentra.
 */

export const obtenerPolizaPdf = async numPoliza => {
  const productores = ['silvana', 'kevin', 'angel'];

  // Valores fijos
  const sucursal = 1;
  const ramo = 4;
  const endoso = 0;

  console.log(`🔄 Buscando productor correcto para póliza ${numPoliza}...\n`);

  for (const productorId of productores) {
    console.log(`➡️ Probando con productor: ${productorId}...`);

    try {
      // 1️⃣ Obtener token para ese productor
      const token = await obtenerTokenProductor(productorId);

      // 2️⃣ Construir URL completa con parámetros
      const url = `${API_URL}/obtenerPdf/${sucursal}/${ramo}/${numPoliza}/${endoso}?apikey=${API_KEY}`;

      console.log(`📡 GET → ${url}`);

      // 3️⃣ Llamar a la API
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/pdf',
          Cookie: 'ROUTEID=.1',
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Error API Provincia Póliza: ${response.status} ${response.statusText} → ${text}`);
      }

      // 4️⃣ Si responde OK → retornamos el PDF
      const pdfBuffer = await response.arrayBuffer();
      console.log(`✅ Póliza obtenida exitosamente con productor: ${productorId}`);
      return Buffer.from(pdfBuffer);
    } catch (error) {
      console.error(`❌ ${productorId.toUpperCase()} no válido: ${error.message}\n`);
      continue; // probar siguiente productor
    }
  }

  console.error('🚫 Ningún productor válido para esta póliza.');
  return { error: true, message: `⚠ No se encontró la póliza *${numPoliza}* con ningún productor.` };
  throw new Error('No se pudo obtener la póliza con ningún productor.');
};
