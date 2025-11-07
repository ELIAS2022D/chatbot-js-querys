import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const BASE_URL = process.env.RUS_BASE_URL;
const API_KEY = process.env.RUS_API_KEY;

// 🔹 Acepta credenciales dinámicas (kevin, angel, etc.)
export async function obtenerTokenRUS(user, pass) {
  const url = `${BASE_URL}/login/token`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      },
      body: JSON.stringify({
        username: user,   // 👈 formato correcto según RUS
        password: pass,   // 👈 formato correcto según RUS
      }),
    });

    const text = await response.text();

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${text}`);
    }

    const data = JSON.parse(text);

    console.log("✅ Token obtenido correctamente");
    return data.access_token; // 👈 campo correcto del token
  } catch (err) {
    console.error("❌ Error al autenticar RUS:", err.message);
    throw err;
  }
}