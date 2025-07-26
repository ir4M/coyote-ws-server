const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid");
const http = require("http");

const PORT = process.env.PORT || 10000;

// HTTP-Server für WSS bei Render
const server = http.createServer();
const wss = new WebSocket.Server({ server });

const sessions = new Map(); // connectionId → { web, app }

wss.on("connection", (ws, req) => {
  let role = null;
  let connectionId = null;

  // Wenn Web-Client: sofort ID generieren und senden
  const tempId = uuidv4();
  ws.send(JSON.stringify({ connectionId: tempId }));

  ws.on("message", (msg) => {
    console.log(`📩 Nachricht empfangen: ${msg}`);

    try {
      const data = JSON.parse(msg);

      // Erstverbindung: Rolle und ID setzen
      if (data.connectionId && data.role) {
        role = data.role.trim();
        connectionId = data.connectionId.trim();

        console.log(`🔗 Rolle empfangen: ${role}, ID: ${connectionId}`);

        if (!sessions.has(connectionId)) {
          sessions.set(connectionId, {});
        }

        const session = sessions.get(connectionId);
        session[role] = ws;

        // Wenn App verbunden → Handshake senden
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

        // Wenn beide Rollen verbunden → Erfolg
        if (session.web && session.app) {
          console.log(`🎉 Session vollständig: ${connectionId}`);
        }

        return;
      }

      // Nachricht durchleiten zwischen Web und App
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
