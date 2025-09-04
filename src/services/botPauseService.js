// Estado de pausa de usuarios
const pausedUsers = {};

/**
 * Alterna pausa de bot para un usuario.
 * @param {string} userId
 * @returns {boolean} true si quedó pausado, false si quedó reactivado
 */
const togglePauseBot = (userId) => {
  if (pausedUsers[userId]) {
    delete pausedUsers[userId];
    return false; // se reactivó
  } else {
    pausedUsers[userId] = true;
    return true; // se pausó
  }
};

/**
 * Verifica si el bot está pausado para un usuario.
 * @param {string} userId
 * @returns {boolean}
 */
const isBotPaused = (userId) => {
  return !!pausedUsers[userId];
};

export { togglePauseBot, isBotPaused };
