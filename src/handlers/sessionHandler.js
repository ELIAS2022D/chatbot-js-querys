import { changeUserData } from "../services/sessionsService.js";
import { showOptions } from "../utils/navigationUtils.js";
import { hasBeenLongEnough } from "../utils/toolkit.js";

export const handleSessionTimeout = async (clientName, userId, client, session) => {
    if (hasBeenLongEnough(session.lastMessage, 0.05)) {
        await resetSession(clientName, userId);
        return `Bienvenido/a de nuevo.\n\n${showOptions(client.menu.options)}`;
    }

    return null;
};

export const resetSession = async (clientName, userId) => {
    await changeUserData(clientName, userId, "botPaused", false);
    await changeUserData(clientName, userId, "currentNode", null);
    await changeUserData(clientName, userId, "inputFlow", null);
};