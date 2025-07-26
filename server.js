const WebSocket = require("ws");

const PORT = process.env.PORT || 10000;
const wss = new WebSocket.Server({ port: PORT });

const sessions = new Map(); // connectionId → { web, app }

wss.on("connection", (ws) => {
  let role = null;
  let connectionId = null;

  console.log("Neue Verbindung eingegangen");

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);

      if (data.connectionId && data.role) {
        // Verbindung initialisieren
        connectionId = data.connectionId;
        role = data.role;

        if (!sessions.has(connectionId)) {
          sessions.set(connectionId, {});
        }

        const session = sessions.get(connectionId);
        session[role] = ws;

        console.log(
          `Client registriert: role=${role}, connectionId=${connectionId}`
        );

        // Wenn beide Rollen vorhanden sind → weiterleiten aktivieren
        if (session.web && session.app) {
          console.log(`Session aktiv: ${connectionId}`);
        }

        return;
      }

      // Normale Nachricht → weiterleiten, falls Session aktiv
      if (!connectionId || !role) {
        console.warn("Nachricht ohne gültige Session erhalten");
        return;
      }

      const session = sessions.get(connectionId);
      if (!session || !session.web || !session.app) {
        console.warn("Session unvollständig");
        return;
      }

      const target = role === "web" ? session.app : session.web;
      if (target.readyState === WebSocket.OPEN) {
        target.send(msg);
      }
    } catch (e) {
      console.error("Fehler beim Verarbeiten der Nachricht:", e);
    }
  });

  ws.on("close", () => {
    if (!connectionId || !role) return;

    const session = sessions.get(connectionId);
    if (session) {
      session[role] = null;
      console.log(`Verbindung getrennt: ${role} → ${connectionId}`);

      // Wenn beide Seiten getrennt → Session löschen
      if (!session.web && !session.app) {
        sessions.delete(connectionId);
        console.log(`Session gelöscht: ${connectionId}`);
      }
    }
  });
});

console.log(`DG-LAB-kompatibler WebSocket-Server läuft auf Port ${PORT}`);
