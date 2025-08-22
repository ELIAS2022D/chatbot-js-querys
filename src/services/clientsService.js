import fs from "fs";

const getClients = () => {
  const clients = JSON.parse(
    fs.readFileSync("./src/data/clients.json", "utf8")
  );
  return clients;
};

export { getClients };
