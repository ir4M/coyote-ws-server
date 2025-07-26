const wsServerUrl = "wss://coyote-ws-server.onrender.com";
let connectionId = "";

// WebSocket-Verbindung aufbauen
const ws = new WebSocket(wsServerUrl);

const qrcodeImg = new QRCode(document.getElementById("qrcode"), {
  width: 128,
  height: 128,
});

ws.onopen = () => {
  console.log("✅ Verbindung aufgebaut");
};

ws.onmessage = (event) => {
  console.log("📩 Nachricht:", event.data);

  try {
    const data = JSON.parse(event.data);
    if (data.connectionId) {
      connectionId = data.connectionId;

      // Verbindung dem Server melden
      ws.send(JSON.stringify({ role: "web", connectionId }));

      // QR-Code erzeugen
      updateQRCode();
    }
  } catch (e) {
    console.warn("Fehlerhafte Nachricht ignoriert.");
  }
};

function updateQRCode() {
  const qrData =
    "https://www.dungeon-lab.com/app-download.php#DGLAB-SOCKET#" +
    wsServerUrl +
    "/" +
    connectionId;

  console.log("🔳 QR-Daten:", qrData);
  qrcodeImg.makeCode(qrData);
}
