import { v4 as uuidv4 } from "https://cdn.skypack.dev/uuid";

export let connectionId = uuidv4();
export let ws = null;

export function initWebSocket(onBind) {
  ws = new WebSocket("wss://coyote-ws-server.onrender.com");

  ws.addEventListener("open", () => {
    console.log("✅ WebSocket geöffnet:", connectionId);
    ws.send(
      JSON.stringify({
        type: "bind",
        clientId: connectionId,
        targetId: "",
        message: "DGLAB",
      })
    );
  });

  ws.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    console.log("📩 Nachricht erhalten:", msg);

    if (msg.type === "bind" && msg.message === "200") {
      onBind?.(msg);
    }
  });

  ws.addEventListener("close", () => {
    console.log("🔌 Verbindung geschlossen");
  });

  ws.addEventListener("error", (err) => {
    console.error("❌ Fehler:", err);
  });
}
