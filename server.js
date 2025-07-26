const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid");
const http = require("http");

const PORT = process.env.PORT || 10000;

// HTTP-Server für Render (wichtig für Port-Scan)
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

  // Generiere UUID für Web-Client (zurück an Client senden)
  const tempId = uuidv4();
  ws.send(JSON.stringify({ connectionId: tempId }));

  ws.on("message", (msg) => {
    console.log("📩 Rohdaten empfangen:", msg);

    try {
      const data = JSON.parse(msg);

      // Erstkontakt: Rolle + ID setzen
      if (data.connectionId && data.role) {
        role = data.role.trim();
        connectionId = data.connectionId.trim();

        console.log(`🔗 Rolle empfangen: ${role}, ID: ${connectionId}`);

        if (!sessions.has(connectionId)) {
          sessions.set(connectionId, {});
        }

        const session = sessions.get(connectionId);
        session[role] = ws;

        // Wenn App verbunden: Handshake senden
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

        // Wenn beide Seiten da → Session OK
        if (session.web && session.app) {
          console.log(`🎉 Session vollständig: ${connectionId}`);
        }

        return;
      }

      // Weiterleitung: Nachricht an Gegenstelle schicken
      if (role && connectionId) {
        const session = sessions.get(connectionId);
        const target = role === "web" ? session.app : session.web;

        if (target && target.readyState === WebSocket.OPEN) {
          target.send(msg);
        }
      }
    } catch (e) {
      console.warn("❌ Fehler beim Parsen:", e);
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
