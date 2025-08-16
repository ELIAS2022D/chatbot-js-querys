async function handleMessage(message, menu) {
  const texto = message.body.toLowerCase();
  
  //Necesitamos guardar y evaluar la hora del ultimo mensaje para saber si hay que mandarle el menú o simplemente devolverle el default

  //Lo mejor sería no tener que depender de un menu configurado de forma estática sino generar menú de forma flexible según la cantidad de menus y mensajes disponibles por clientes
  
  if (texto === "menu") {
    return message.reply(menu.welcome);
  } else if (texto === "1") {
    return message.reply(menu.response1);
  } else if (texto === "2") {
    return message.reply(menu.response2);
  } else if (texto === "3") {
    return message.reply(menu.response3);
  } else if (texto === "4") {
    return message.reply(menu.response4);
  } else {
    return message.reply(menu.default);
  }
}

export default handleMessage;
