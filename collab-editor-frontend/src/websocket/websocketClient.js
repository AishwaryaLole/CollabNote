import { Client } from "@stomp/stompjs";

const WS_URL = "ws://localhost:8080/ws";

let client = null;

export function connectWebSocket(documentId, onMessage) {

    const token = localStorage.getItem("token");

    client = new Client({
        brokerURL: WS_URL,

        connectHeaders: {
            Authorization: `Bearer ${token}`
        },

        reconnectDelay: 5000,

        onConnect: () => {

            console.log("WebSocket connected");

            client.subscribe(
                `/topic/document/${documentId}`,
                (message) => {

                    const data = JSON.parse(message.body);

                    onMessage(data);
                }
            );
        },

        onStompError: (frame) => {
            console.error(
                "WebSocket error:",
                frame.headers["message"]
            );
        },

        onWebSocketError: (error) => {
            console.error(
                "WebSocket connection error:",
                error
            );
        }
    });

    client.activate();
}

export function sendDocumentChange(
    documentId,
    content
) {

    if (!client || !client.connected) {
        console.error("WebSocket is not connected");
        return;
    }

    client.publish({
        destination: "/app/document",
        body: JSON.stringify({
            documentId: documentId,
            content: content
        })
    });
}

export function disconnectWebSocket() {

    if (client) {
        client.deactivate();
        client = null;
    }
}