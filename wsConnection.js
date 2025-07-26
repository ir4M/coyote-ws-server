const wsServerUrl = "wss://coyote-ws-server.onrender.com";
let connectionId = "";

// QR-Code erzeugen im <div id="qrcode">
const qrcodeImg = new QRCode(document.getElementById("qrcode"), {
  width: 128,
  height: 128,
});

// WebSocket-Verbindung aufbauen
const ws = new WebSocket(wsServerUrl);

ws.onopen = () => {
  console.log("WebSocket-Verbindung erfolgreich");
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
    console.warn("Keine gültige JSON-Antwort erhalten.");
  }
};

ws.onerror = (err) => {
  console.error("WebSocket-Fehler:", err);
};

ws.onclose = () => {
  console.log("WebSocket getrennt");
};

// DG-LAB-konforme QR-Adresse generieren
function updateQRCode() {
  const qrData =
    "https://www.dungeon-lab.com/app-download.php#DGLAB-SOCKET#" +
    wsServerUrl +
    "/" +
    connectionId;

  console.log("QR-Daten:", qrData);
  qrcodeImg.makeCode(qrData);
}
