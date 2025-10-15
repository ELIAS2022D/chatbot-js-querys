import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const url = "https://api.rus.com.ar/sandbox/login/token"; // sandbox oficial
const apiKey = "QRxZOd7QUdasK5H3fcVJO6jsaqZuDPQS2kYVlNIf"; // tu API Key sandbox
const username = process.env.RUS_USER_ANGEL_TEST; // usuario de prueba
const password = process.env.RUS_PASS_ANGEL_TEST; // contraseña de prueba

export async function obtenerTokenRUS() {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    const text = await response.text();

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${text}`);
    }

    const data = JSON.parse(text);

    console.log("✅ Token obtenido correctamente");
    return data.access_token;
  } catch (err) {
    console.error("❌ Error al autenticar:", err.message);
    throw err;
  }
}
