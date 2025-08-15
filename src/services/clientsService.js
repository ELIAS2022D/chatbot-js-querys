import fs from "fs";

function getClients() {
  const clients = JSON.parse(fs.readFileSync("./src/data/clients.json", "utf8"));
  return clients;
}

export default getClients;
