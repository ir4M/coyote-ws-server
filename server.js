const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const PORT = process.env.PORT || 10000;
const wss = new WebSocket.Server({ port: PORT });

const clients = new Map();
const relations = new Map();
const clientTimers = new Map();

const heartbeatMsg = {
    type: "heartbeat",
    clientId: "",
    targetId: "",
    message: "200"
};

let heartbeatInterval;

function delaySendMsg(clientId, ws, target, sendData, totalSends, timeSpace, channel) {
    target.send(JSON.stringify(sendData));
    totalSends--;
    if (totalSends > 0) {
        return new Promise((resolve) => {
            const timerId = setInterval(() => {
                if (totalSends > 0) {
                    target.send(JSON.stringify(sendData));
                    totalSends--;
                }
                if (totalSends <= 0) {
                    clearInterval(timerId);
                    ws.send("✅ Nachricht vollständig gesendet");
                    clientTimers.delete(clientId + "-" + channel);
                    resolve();
                }
            }, timeSpace);
            clientTimers.set(clientId + "-" + channel, timerId);
        });
    }
}

wss.on('connection', function connection(ws) {
    const clientId = uuidv4();
    console.log('🌐 Neue Verbindung mit ID:', clientId);
    clients.set(clientId, ws);
    ws.send(JSON.stringify({ type: 'bind', clientId, message: 'targetId', targetId: '' }));

    ws.on('message', function incoming(message) {
        console.log("📩 Nachricht erhalten:", message.toString());

        let data = null;
        try {
            data = JSON.parse(message);
        } catch (e) {
            ws.send(JSON.stringify({ type: 'msg', message: '403' }));
            return;
        }

        const { type, clientId, targetId, message: msg, channel, time, strength } = data;

        if (!clientId || !targetId || !type) return;

        const sender = clients.get(clientId);
        const receiver = clients.get(targetId);

        // Bind
        if (type === "bind") {
            if (sender && receiver && !relations.has(clientId) && ![...relations.values()].includes(targetId)) {
                relations.set(clientId, targetId);
                const payload = { type: "bind", clientId, targetId, message: "200" };
                sender.send(JSON.stringify(payload));
                receiver.send(JSON.stringify(payload));
            } else {
                ws.send(JSON.stringify({ type: "bind", clientId, targetId, message: "400" }));
            }
            return;
        }

        // Check relation
        if (relations.get(clientId) !== targetId) {
            ws.send(JSON.stringify({ type: "bind", clientId, targetId, message: "402" }));
            return;
        }

        // Strength Message (mode 1/2/3)
        if ([1,2,3].includes(type)) {
            const sendType = type - 1;
            const sendChannel = channel || 1;
            const sendStrength = strength || 1;
            const messageStr = `strength-${sendChannel}+${sendType}+${sendStrength}`;
            receiver.send(JSON.stringify({ type: "msg", clientId, targetId, message: messageStr }));
            return;
        }

        // Direct Message (type 4 or clientMsg)
        if (["clientMsg", 4].includes(type)) {
            const sendtime = time || 5;
            const totalSends = sendtime;
            const timeSpace = 1000;
            const sendData = { type: "msg", clientId, targetId, message: "pulse-" + msg };

            if (clientTimers.has(clientId + "-" + channel)) {
                clearInterval(clientTimers.get(clientId + "-" + channel));
                clientTimers.delete(clientId + "-" + channel);
            }

            delaySendMsg(clientId, ws, receiver, sendData, totalSends, timeSpace, channel);
            return;
        }

        // Default forward
        receiver.send(JSON.stringify(data));
    });

    ws.on('close', () => {
        console.log('🔌 Verbindung geschlossen für:', clientId);
        clients.delete(clientId);
        for (const [key, val] of relations.entries()) {
            if (key === clientId || val === clientId) {
                relations.delete(key);
                const otherId = key === clientId ? val : key;
                const other = clients.get(otherId);
                if (other) {
                    other.send(JSON.stringify({ type: "break", clientId: key, targetId: val, message: "209" }));
                    other.close();
                }
            }
        }
    });

    ws.on('error', (err) => {
        console.error("❌ WebSocket Fehler:", err.message);
    });

    if (!heartbeatInterval) {
        heartbeatInterval = setInterval(() => {
            for (const [id, client] of clients.entries()) {
                heartbeatMsg.clientId = id;
                heartbeatMsg.targetId = relations.get(id) || "";
                client.send(JSON.stringify(heartbeatMsg));
            }
        }, 60000);
    }
});