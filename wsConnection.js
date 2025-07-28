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

    // Reaktion auf bind-Nachricht vom Server (Handshake)
    if (msg.type === "bind" && msg.clientId && msg.message === "targetId") {
      connectionId = msg.clientId;
      console.log("🔗 clientId erhalten:", connectionId);
    }

    // Optional: weitere Nachrichtentypen behandeln
    if (msg.type === "heartbeat") {
      console.log("❤️ Herzschlag empfangen:", msg.message);
    }
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
