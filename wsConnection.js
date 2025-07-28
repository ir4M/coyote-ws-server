// wsConnection.js

export let connectionId = null;

const socketURL = "wss://coyote-ws-server.onrender.com";
const ws = new WebSocket(socketURL);

ws.onopen = () => {
  console.log("✅ WebSocket-Verbindung erfolgreich");
};

ws.onmessage = (event) => {
  try {
    const msg = JSON.parse(event.data);
    console.log("📩 Nachricht vom Server:", msg);

    if (msg.connectionId) {
      connectionId = msg.connectionId;
      console.log("🔗 connectionId erhalten:", connectionId);
    }

    // Weitere Nachrichtenbehandlung (z. B. heartbeats) kannst du hier ergänzen
  } catch (e) {
    console.error("❌ Fehler beim Verarbeiten der Nachricht:", e);
  }
};

ws.onerror = (error) => {
  console.error("❗ WebSocket-Fehler:", error);
};

ws.onclose = () => {
  console.warn("🔌 WebSocket-Verbindung geschlossen");
};
