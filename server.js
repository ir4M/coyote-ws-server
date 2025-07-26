const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid");

const PORT = process.env.PORT || 10000;
const wss = new WebSocket.Server({ port: PORT });

const sessions = new Map(); // connectionId → { web, app }

wss.on("connection", (ws) => {
  let role = null;
  let connectionId = null;

  // UUID erzeugen und gleich an die Web-Client senden
  const id = uuidv4();
  ws.send(JSON.stringify({ connectionId: id }));

  ws.on("message", (msg) => {
    console.log(`📩 Nachricht empfangen: ${msg}`);

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

        if (role === "app") {
          // Sende Handshake-Antwort für die App (wichtig!)
          ws.send(
            JSON.stringify({
              code: 200,
              type: "init_success",
              connectionId: connectionId,
              msg: "ready",
            })
          );
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
          target.send(msg);
          console.log(
            `📤 Weitergeleitet an ${role === "web" ? "app" : "web"}: ${msg}`
          );
        }
      }
    } catch (e) {
      console.warn("❌ Fehler beim Parsen:", e);
    }
  });

  ws.on("close", () => {
    if (!connectionId || !role) return;

    const session = sessions.get(connectionId);
    if (session) {
      session[role] = null;
      console.log(`🔌 Verbindung getrennt: ${role} (${connectionId})`);

      if (!session.web && !session.app) {
        sessions.delete(connectionId);
        console.log(`🗑️ Session gelöscht: ${connectionId}`);
      }
    }
  });
});

console.log(`🚀 DG-LAB-kompatibler WebSocket-Server läuft auf Port ${PORT}`);
