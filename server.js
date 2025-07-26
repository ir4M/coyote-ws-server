const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid");

const PORT = process.env.PORT || 10000;
const wss = new WebSocket.Server({ port: PORT });

// Jede Verbindung erhält eine eigene UUID
const clients = new Map(); // id => ws
const pairings = new Map(); // id => partnerId

wss.on("connection", (ws) => {
  const id = uuidv4();
  clients.set(id, ws);

  console.log("Client verbunden:", id);

  // UUID an den Client senden
  ws.send(JSON.stringify({ connectionId: id }));

  // Versuche zu koppeln (wenn zwei Clients da sind)
  tryPairClients();

  ws.on("message", (msg) => {
    console.log(`Nachricht von ${id}: ${msg}`);

    const partnerId = pairings.get(id);
    const partnerSocket = clients.get(partnerId);

    if (partnerSocket && partnerSocket.readyState === WebSocket.OPEN) {
      partnerSocket.send(msg); // Weiterleiten an Partner
    } else {
      console.log("Kein Partner verfügbar oder geschlossen.");
    }
  });

  ws.on("close", () => {
    console.log("Verbindung geschlossen:", id);
    clients.delete(id);

    const partnerId = pairings.get(id);
    pairings.delete(id);
    if (partnerId) pairings.delete(partnerId);
  });
});

function tryPairClients() {
  const ids = Array.from(clients.keys());
  if (ids.length < 2) return;

  // Wenn zwei Clients vorhanden sind, verbinde sie miteinander
  const [id1, id2] = ids.slice(-2); // letzte zwei
  pairings.set(id1, id2);
  pairings.set(id2, id1);

  console.log(`Clients gekoppelt: ${id1} <--> ${id2}`);
}

console.log(`WebSocket-Server läuft auf Port ${PORT}`);
