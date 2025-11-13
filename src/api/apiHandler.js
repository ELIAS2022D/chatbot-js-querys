import fs from 'fs';
import { descargarPolizaCompletaRUS } from '../apiRus/polizaService.js';
import { obtenerPolizaPdf } from '../apiProvincia/polizaService.js';

export const handleApiCall = async (apiName, inputData) => {
  switch (apiName) {
    // ---- Provincia ----
    case 'apiProvincia': {
      try {
        const pdfBuffer = await obtenerPolizaPdf(inputData.numPoliza);

        if (!pdfBuffer || pdfBuffer.error) {
          return {
            message: `⚠ No se pudo descargar la póliza Provincia: ${pdfBuffer?.message || 'Error desconocido'}`,
            error: true
          };
        }

        return {
          message: `📄 Tu póliza *${inputData.numPoliza}* de Provincia Seguros fue descargada correctamente ✅`,
          fileBase64: pdfBuffer.toString('base64'),
          mimeType: 'application/pdf',
          fileName: `provincia_${inputData.numPoliza}.pdf`
        };
      } catch (err) {
        console.error('❌ Error Provincia:', err.message);
        return { message: `⚠ Error al obtener la póliza Provincia: ${err.message}`, error: true };
      }
    }

    // ---- RUS ----
    case 'apiRus': {
      try {
        const pdfBuffer = await descargarPolizaCompletaRUS(inputData.numPoliza);

        // Verificamos que haya devuelto un Buffer válido
        if (!pdfBuffer || pdfBuffer.error) {
          throw new Error("Respuesta inválida al descargar la póliza RUS");
        }

        return {
          message: `📄 Tu póliza *${inputData.numPoliza}* de Rio Uruguay Seguros fue descargada correctamente ✅`,
          fileBase64: pdfBuffer.toString('base64'),
          mimeType: 'application/pdf',
          fileName: `rus_${inputData.numPoliza}.pdf`
        };
      } catch (err) {
        console.error('❌ Error RUS:', err.message);
        return {
          message: `⚠ No se pudo descargar la póliza RUS: ${err.message}`,
          error: true
        };
      }
    }
    // ---- Cotización (u otros servicios) ----
    case 'cotizacion':
      return {
        message: `💰 Cotización generada:\n\nAuto: ${inputData.modelo}\nValor: $${inputData.valor}`,
      };

    default:
      return { message: `⚠ No se encontró una acción para *${apiName}*` };
  }
};