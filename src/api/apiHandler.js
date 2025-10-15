import { descargarPolizaCompletaRUS } from '../apiRus/rusService.js';

export const handleApiCall = async (apiName, inputData) => {
  switch (apiName) {
    case 'consultaAPI':
      setTimeout(() => {}, 5000);
      const rutaArchivo = await descargarPolizaCompletaRUS(4, inputData.numPoliza, '');
      return rutaArchivo;
    // return `📄 Tu póliza fue encontrada:\n\nNúmero: 123456\nEstado: Activa\nVigencia: hasta 31/12/2025 \nDatos dados: ${inputData}`;

    case 'cotizacion':
      return `💰 Cotización generada:\n\nAuto: ${inputData.modelo}\nValor: $${inputData.valor}`;

    // Agregá más casos según tus flujos
    default:
      return `⚠ No se encontró una acción para *${apiName}*`;
  }
};
