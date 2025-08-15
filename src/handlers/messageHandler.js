async function handleMessage(message, menu) {
  const texto = message.body.toLowerCase();

  //Necesitamos guardar y evaluar la hora del ultimo mensaje para saber si hay que mandarle el menú o simplemente devolverle el default

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
