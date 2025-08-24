import { existUserSession, createUserSession } from "../services/usersSessionsService.js";

const handleMessage = async (message, clientId, config) => {
  const texto = message.body.toLowerCase();
  const keywords = config.keywords;
  const menu = config.menu;

  //Si todavía no se creó el user session significa que es la primera vez que habla
  // clientId = client1, etc
  if (!existUserSession(message, clientId)) {
    createUserSession(message, clientId);
  }
  //Necesitamos guardar y evaluar la hora del ultimo mensaje para saber si hay que mandarle el menú o simplemente devolverle el default
  //Lo mejor sería no tener que depender de un menu configurado de forma estática sino generar menú de forma flexible según la cantidad de menus y mensajes disponibles por clientes

  if (texto === "hola" || texto === "menu") {
    return message.reply(menu.welcome);
  } else if (texto === "1") {
    return message.reply(menu.response1);
  } else if (texto === "2") {
    return message.reply(menu.response2);
  } else if (texto === "3") {
    return message.reply(menu.response3);
  } else if (texto === "4") {
    return message.reply(menu.response4);
  } else if (texto === "5") {
    return message.reply(menu.response5);
  } else if (texto === "6") {
    return message.reply(menu.response6);
  } else if (texto === "7") {
    return message.reply(menu.response7);
  } else {
    for (const [responseKey, keywordList] of Object.entries(keywords)) {
      //Si algun keyword está en el texto
      if (keywordList.some((kw) => texto.includes(kw))) {
        return message.reply(
          "Creo que te refieres a esto: \n" + menu[responseKey]
        );
      }
    }

    return message.reply(menu.default);
  }
};

export { handleMessage };
