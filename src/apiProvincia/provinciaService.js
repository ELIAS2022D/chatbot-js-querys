// ---------------------------------------------------------
// 🌐 Servicio de autenticación de productores (Provincia Seguros)
// ---------------------------------------------------------
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const productores = {
  silvana: {
    user: process.env.PROD_SILVANA_USER,
    pass: process.env.PROD_SILVANA_PASS,
  },
  kevin: {
    user: process.env.PROD_KEVIN_USER,
    pass: process.env.PROD_KEVIN_PASS,
  },
  angel: {
    user: process.env.PROD_ANGEL_USER,
    pass: process.env.PROD_ANGEL_PASS,
  },
};

export const obtenerTokenProductor = async (productorId) => {
  const productor = productores[productorId];

  console.log(productor);

  if (!productor) throw new Error(`❌ Productor no configurado: ${productorId}`);

  const body = new URLSearchParams({
    client_id: process.env.PROVINCIA_CLIENT_ID,
    client_secret: process.env.PROVINCIA_CLIENT_SECRET,
    grant_type: process.env.PROVINCIA_GRANT_TYPE,
    username: productor.user,
    password: productor.pass,
  });

  const resp = await fetch(process.env.PROVINCIA_AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!resp.ok) {
    const error = await resp.text();
    throw new Error(`Error al obtener token (${productorId}): ${error}`);
  }

  const data = await resp.json();
  return data.access_token;
};
