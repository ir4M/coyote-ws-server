const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid");

const PORT = process.env.PORT || 10000;
const wss = new WebSocket.Server({ port: PORT });

const sessions = new Map(); // connectionId → { web, app }

console.log(`🚀 DG-LAB-kompatibler WebSocket-Server läuft auf Port ${PORT}`);

wss.on("connection", (ws, req) => {
  console.log("🌐 Neue Verbindung hergestellt");
  console.log("📡 IP:", req.socket.remoteAddress);

  let role = null;
  let connectionId = null;

  // Erzeuge eine UUID und sende sie dem Webclient
  const id = uuidv4();
  ws.send(JSON.stringify({ connectionId: id }));

  ws.on("message", (data) => {
    let raw = data;

    try {
      if (Buffer.isBuffer(data)) {
        console.log("📩 Rohdaten empfangen:", data);
        raw = data.toString("utf8");
      }

      console.log("📩 Nachricht als String:", raw);
      const msg = JSON.parse(raw);

      // Identifikation: role & connectionId
      if (msg.role && msg.connectionId) {
        role = msg.role;
        connectionId = msg.connectionId.trim();

        console.log(`🔗 Rolle empfangen: ${role}, ID: ${connectionId}`);

        if (!sessions.has(connectionId)) {
          sessions.set(connectionId, {});
        }

        const session = sessions.get(connectionId);
        session[role] = ws;

        // Wenn beide Seiten verbunden sind → Bindung senden
        if (session.web && session.app) {
          console.log(`🎉 Session vollständig: ${connectionId}`);

          // Sende "bind"-Nachricht an App
          session.app.send(
            JSON.stringify({
              type: "bind",
              clientId: connectionId,
              message: "targetId",
              targetId: connectionId, // App erwartet offenbar clientId == targetId
            })
          );
        }

        return;
      }

      // Weiterleitung von Nachrichten
      if (connectionId && role) {
        const session = sessions.get(connectionId);
        if (!session) return;

        const target = role === "web" ? session.app : session.web;

        if (target && target.readyState === WebSocket.OPEN) {
          target.send(raw);
        } else {
          console.warn("⚠️ Ziel-Client nicht verbunden");
        }
      }
    } catch (err) {
      console.warn("❌ Fehler beim Verarbeiten der Nachricht:", err);
    }
  });

  ws.on("close", () => {
    if (!connectionId || !role) {
      console.log("🔌 Verbindung geschlossen (noch ohne Identifikation)");
      return;
    }

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
