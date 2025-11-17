import { createClient } from "redis";
const redis = createClient({ url: process.env.REDIS_URL });
await redis.connect();

async function checkPause(message) {
    const text = message.body?.toLowerCase() || "";

    // PAUSAR
    if (text === "pausar") {
        await redis.set("botPaused", "true");
        return {
            stop: true,
            reply: "🤖 El bot fue PAUSADO. Ahora pueden hablar libremente."
        };
    }

    // REACTIVAR
    if (text === "reactivar") {
        await redis.set("botPaused", "false");
        return {
            stop: true,
            reply: "⚡ El bot fue REACTIVADO y ya está respondiendo normalmente."
        };
    }

    // Verificar si está pausado
    const paused = await redis.get("botPaused");
    if (paused === "true") {
        return { stop: true }; // no responder nada
    }

    return { stop: false };
}

export default checkPause;