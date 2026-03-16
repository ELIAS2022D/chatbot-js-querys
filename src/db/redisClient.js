import { createClient } from "redis";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const {
  REDIS_HOST,
  REDIS_PORT,
  REDIS_USERNAME,
  REDIS_PASSWORD
} = process.env;

if (!REDIS_HOST || !REDIS_PORT || !REDIS_USERNAME || !REDIS_PASSWORD) {
  throw new Error("Faltan variables de entorno de Redis");
}

const redisUrl = `rediss://${REDIS_USERNAME}:${encodeURIComponent(REDIS_PASSWORD)}@${REDIS_HOST}:${REDIS_PORT}`;

const client = createClient({
  url: redisUrl,
  socket: {
    tls: true,
    reconnectStrategy: (retries) => Math.min(retries * 200, 3000)
  }
});

client.on("error", (err) => {
  console.error("❌ Redis Client Error:", err.message);
});

client.on("connect", () => {
  console.log("✅ Redis conectado");
});

client.on("ready", () => {
  console.log("🚀 Redis listo para usar");
});

await client.connect();

export default client;
