import fs from 'fs';
import { descargarPolizaCompletaRUS } from '../apiRus/rusService.js';
import { obtenerPolizaPdf } from '../apiProvincia/polizaService.js';

export const handleApiCall = async (apiName, inputData) => {
  switch (apiName) {
    case 'consultaAPI': {
      try {
        const response = await obtenerPolizaPdf(inputData.numPoliza);

        if (response.error) {
          return {
            message: response.message,
            error: true
          };
        }

        return {
          message: `📄 Tu póliza *${inputData.numPoliza}* fue descargada correctamente ✅`,
          fileBase64: response.toString('base64'),
          mimeType: 'application/pdf',
          fileName: `poliza_${inputData.numPoliza}.pdf`,
        };
      } catch (err) {
        console.error('❌ Error al consultar póliza:', err.message);
        return {
          message: `⚠ No se pudo descargar la póliza: ${err.message}`,
        };
      }
    }
    case 'cotizacion':
      return {
        message: `💰 Cotización generada:\n\nAuto: ${inputData.modelo}\nValor: $${inputData.valor}`,
      };

    default:
      return {
        message: `⚠ No se encontró una acción para *${apiName}*`,
      };
  }
};
