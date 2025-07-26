const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 60536 });

wss.on("connection", (ws) => {
  console.log("Client verbunden");
  ws.on("message", (msg) => {
    console.log("Nachricht erhalten:", msg);
    // einfache Antwort als Echo
    ws.send(msg);
  });
});

console.log("WebSocket-Server läuft auf ws://localhost:60536");
