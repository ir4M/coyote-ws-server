// Deine WebSocket-Server-URL
const wsServerUrl = "wss://coyote-ws-server.onrender.com";

// Zufällige Verbindung-ID erzeugen (z. B. UUID)
function generateConnectionId() {
  return "cid-" + Math.random().toString(36).substring(2, 12);
}

const connectionId = generateConnectionId();

// QR-Code Objekt initialisieren
const qrcodeImg = new QRCode(document.getElementById("qrcode"), {
  width: 128,
  height: 128,
});

// WebSocket-Verbindung aufbauen
const ws = new WebSocket(wsServerUrl);

ws.onopen = () => {
  console.log("WebSocket-Verbindung erfolgreich");

  // Rolle und Connection-ID an den Server melden
  ws.send(
    JSON.stringify({
      role: "web",
      connectionId: connectionId,
    })
  );

  // Jetzt QR-Code generieren
  updateQRCode();
};

ws.onmessage = (event) => {
  console.log("Nachricht vom Server:", event.data);
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
