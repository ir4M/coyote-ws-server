const WebSocket = require("ws");
const url = require("url");

const PORT = process.env.PORT || 10000;
const wss = new WebSocket.Server({ port: PORT });

const sessions = new Map(); // connectionId → { web, app }

wss.on("connection", (ws, req) => {
  const location = url.parse(req.url, true);
  const path = location.pathname; // z. B. "/cid-abc123"
  const connectionId = path.replace("/", "");

  console.log("Neue Verbindung:", connectionId);

  if (!sessions.has(connectionId)) {
    sessions.set(connectionId, {});
  }

  const session = sessions.get(connectionId);

  // Entscheide anhand der ersten freien Rolle
  let role;
  if (!session.web) {
    role = "web";
    session.web = ws;
  } else if (!session.app) {
    role = "app";
    session.app = ws;
  } else {
    console.log("Session bereits voll, Verbindung abgelehnt.");
    ws.close();
    return;
  }

  console.log(`Client registriert: role=${role}, connectionId=${connectionId}`);

  if (session.web && session.app) {
    console.log(`Session aktiv: ${connectionId}`);
  }

  ws.on("message", (msg) => {
    const target = role === "web" ? session.app : session.web;
    if (target && target.readyState === WebSocket.OPEN) {
      target.send(msg);
    }
  });

  ws.on("close", () => {
    console.log(`Verbindung geschlossen: ${role} → ${connectionId}`);
    session[role] = null;

    if (!session.web && !session.app) {
      sessions.delete(connectionId);
      console.log(`Session gelöscht: ${connectionId}`);
    }
  });
});

console.log(
  `DG-LAB-kompatibler WebSocket-Server (Pfad-basiert) läuft auf Port ${PORT}`
);
