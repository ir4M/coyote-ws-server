const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid");
const http = require("http");

const PORT = process.env.PORT || 10000;

// HTTP-Server für Render.com (damit Port-Scan klappt)
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("🧩 WebSocket-Server läuft.");
});

const wss = new WebSocket.Server({ server });

const sessions = new Map(); // connectionId → { web, app }

wss.on("connection", (ws, req) => {
  console.log("🌐 Neue Verbindung hergestellt");
  console.log("📡 IP:", req.socket.remoteAddress);

  let role = null;
  let connectionId = null;

  // UUID generieren und direkt an Webclient senden
  const tempId = uuidv4();
  ws.send(JSON.stringify({ connectionId: tempId }));

  ws.on("message", (msg) => {
    console.log("📩 Rohdaten empfangen:", msg);

    try {
      const jsonStr = msg.toString();
      console.log("📩 Nachricht als String:", jsonStr);

      const data = JSON.parse(jsonStr);

      if (data.connectionId && data.role) {
        role = data.role.trim();
        connectionId = data.connectionId.trim();

        console.log(`🔗 Rolle empfangen: ${role}, ID: ${connectionId}`);

        if (!sessions.has(connectionId)) {
          sessions.set(connectionId, {});
        }

        const session = sessions.get(connectionId);
        session[role] = ws;

        if (role === "app") {
          const handshake = {
            type: "bind",
            clientId: connectionId,
            message: "targetId",
            targetId: "",
          };
          ws.send(JSON.stringify(handshake));
          console.log("🤝 Handshake an App gesendet:", handshake);
        }

        if (session.web && session.app) {
          console.log(`🎉 Session vollständig: ${connectionId}`);
        }

        return;
      }

      // Nachricht weiterleiten
      if (connectionId && role) {
        const session = sessions.get(connectionId);
        const target = role === "web" ? session.app : session.web;

        if (target && target.readyState === WebSocket.OPEN) {
          target.send(jsonStr);
        }
      }
    } catch (e) {
      console.error("❌ Fehler beim Parsen der Nachricht:", e.message);
      console.error("🧾 Ursprüngliche Nachricht:", msg.toString());
    }
  });

  ws.on("close", () => {
    console.log("🔌 Verbindung geschlossen (noch ohne Identifikation)");

    if (!connectionId || !role) return;
    const session = sessions.get(connectionId);
    if (!session) return;

    session[role] = null;
    console.log(`🔌 Verbindung getrennt: ${role} (${connectionId})`);

    if (!session.web && !session.app) {
      sessions.delete(connectionId);
      console.log(`🗑️ Session gelöscht: ${connectionId}`);
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server läuft auf Port ${PORT}`);
});
