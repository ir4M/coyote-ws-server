const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid");

const PORT = process.env.PORT || 60536;
const wss = new WebSocket.Server({ port: PORT });

const clients = new Map();

wss.on("connection", (ws) => {
  const id = uuidv4();
  clients.set(id, ws);

  console.log("Client verbunden:", id);

  // VerbindungId an Client senden
  ws.send(JSON.stringify({ connectionId: id }));

  ws.on("message", (msg) => {
    console.log(`Von ${id}: ${msg}`);
    // Echo oder Weiterleitung
  });

  ws.on("close", () => {
    clients.delete(id);
    console.log("Verbindung geschlossen:", id);
  });
});

console.log(`WebSocket-Server läuft auf Port ${PORT}`);
