const createDefaultClient = async (redisClient, clientName = "clienttest") => {
  const newClient = {
    name: clientName,
    mail: "client.test@gmail.com",
    active: true,
    menu: {
      welcome: "Bienvenida del Cliente 1",
      default: "No entendí tu mensaje",
      showMenu: "menu",
      options: {
        cotizar: {
          response: "Perfecto, te paso los precios",
          hint: "Envía la palabra *cotizar* para recibir una cotización",
        },
        contacto: {
          response: "Podés llamarnos al 0800...",
          hint: "Envía *contacto* para ver cómo comunicarte",
        },
        ayuda: {
          response: "¿En qué puedo ayudarte?",
          hint: "Escribí *ayuda* si necesitás soporte",
        },
      },
    },
    keywords: {
      cotizar: ["cotizar", "precio", "1"],
      contacto: ["contacto", "llamar", "2"],
      ayuda: ["ayuda", "soporte", "3"],
    },
  };

  await redisClient.set(`client:${clientName}`, JSON.stringify(newClient));
};

export { createDefaultClient };
