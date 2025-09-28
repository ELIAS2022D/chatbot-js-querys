import { createClient } from "redis";
import { createDefaultClient } from "../testing/createDefaultClient.js";
import dotenv from "dotenv";

dotenv.config(); //carga las variables de .env

// 🔑 Construimos la URL con user, pass, host y puerto
const redisUrl = `redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;

const client = createClient({
  url: redisUrl,
});

client.on("error", (err) => console.error("❌ Redis Client Error:", err));
client.on("connect", () => console.log("✅ Conectado a Redis correctamente"));

await client.connect();

// await createDefaultClient(client);

export default client;
