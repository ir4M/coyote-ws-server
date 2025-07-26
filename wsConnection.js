// WebSocket-Adresse deines Servers auf render.com
const wsServerUrl = "wss://coyote-ws-server.onrender.com";

// Verbindung-ID (kommt vom Server)
let connectionId = "";

// QR-Code-Generator initialisieren
const qrcodeImg = new QRCode(document.getElementById("qrcode"), {
  width: 128,
  height: 128,
});

// WebSocket starten
const ws = new WebSocket(wsServerUrl);

ws.onopen = () => {
  console.log("WebSocket-Verbindung hergestellt.");
};

ws.onmessage = (event) => {
  console.log("Nachricht vom Server:", event.data);

  try {
    const data = JSON.parse(event.data);
    if (data.connectionId) {
      connectionId = data.connectionId;
      updateQRCode();
    }
  } catch (e) {
    console.log("Nicht-JSON Nachricht erhalten. Ignoriere.");
  }
};

ws.onclose = () => {
  console.log("WebSocket-Verbindung geschlossen.");
};

ws.onerror = (err) => {
  console.error("WebSocket-Fehler:", err);
};

// QR-Code anzeigen mit DG-LAB-Link
function updateQRCode() {
  const qrData =
    "https://www.dungeon-lab.com/app-download.php#DGLAB-SOCKET#" +
    wsServerUrl +
    "/" +
    connectionId;

  qrcodeImg.makeCode(qrData);
}
