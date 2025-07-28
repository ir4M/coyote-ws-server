const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid");

const PORT = process.env.PORT || 10000;
const wss = new WebSocket.Server({ port: PORT });

const sessions = new Map(); // connectionId → { web, app, bound }

console.log(`🚀 DG-LAB-kompatibler WebSocket-Server läuft auf Port ${PORT}`);

wss.on("connection", (ws, req) => {
  console.log("🌐 Neue Verbindung hergestellt");
  console.log("📡 IP:", req.socket.remoteAddress);

  let role = null;
  let connectionId = null;

  const url = req.url || "/";
  const urlId = url.replace("/", "");
  const isAppClient = urlId.length > 10;

  if (isAppClient) {
    connectionId = urlId;
    role = "app";
    console.log(`📲 App verbunden: ${connectionId}`);
    ws.send(JSON.stringify({ connectionId }));
  } else {
    connectionId = uuidv4();
    role = "web";
    console.log(`🖥️ Web verbunden: ${connectionId}`);
    ws.send(JSON.stringify({ connectionId }));
  }

  if (!sessions.has(connectionId)) {
    sessions.set(connectionId, {});
  }

  const session = sessions.get(connectionId);
  session[role] = ws;

  if (session.web && session.app && !session.bound) {
    session.bound = true;
    console.log(`🎉 Session vollständig: ${connectionId}`);

    session.app.send(
      JSON.stringify({
        type: "bind",
        clientId: connectionId,
        message: "targetId",
        targetId: connectionId,
      })
    );
  }

  ws.on("message", (data) => {
    let raw = data;

    try {
      if (Buffer.isBuffer(data)) {
        console.log("📩 Rohdaten empfangen:", data);
        raw = data.toString("utf8");
      }

      console.log("📩 Nachricht als String:", raw);
      const msg = JSON.parse(raw);

      // Weiterleitung
      const target = role === "web" ? session.app : session.web;
      if (target && target.readyState === WebSocket.OPEN) {
        target.send(raw);
      } else {
        console.warn("⚠️ Ziel-Client nicht verbunden");
      }
    } catch (err) {
      console.warn("❌ Fehler beim Verarbeiten der Nachricht:", err);
    }
  });

  ws.on("close", () => {
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
