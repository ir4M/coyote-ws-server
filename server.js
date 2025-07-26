const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid");

const PORT = process.env.PORT || 10000;
const wss = new WebSocket.Server({ port: PORT });

const sessions = new Map(); // connectionId → { web, app }

wss.on("connection", (ws) => {
  let role = null;
  let connectionId = null;

  // Generiere UUID und sende sie an die Webseite
  const id = uuidv4();
  ws.send(JSON.stringify({ connectionId: id }));

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);

      if (data.connectionId && data.role) {
        connectionId = data.connectionId.trim();
        role = data.role;

        console.log(`🔗 Rolle empfangen: ${role}, ID: ${connectionId}`);

        if (!sessions.has(connectionId)) {
          sessions.set(connectionId, {});
        }

        const session = sessions.get(connectionId);
        session[role] = ws;

        if (session.web && session.app) {
          console.log(`🎉 Session vollständig: ${connectionId}`);
        }

        return;
      }

      // Nachricht durchleiten
      if (connectionId && role) {
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

console.log(`🚀 DG-LAB-kompatibler Server läuft auf Port ${PORT}`);
