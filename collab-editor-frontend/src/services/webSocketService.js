import { Client } from "@stomp/stompjs";

let stompClient = null;

export const connectWebSocket = (documentId, onMessageReceived) => {

    stompClient = new Client({
        brokerURL: "ws://localhost:8080/ws",

        onConnect: () => {
            console.log("WebSocket connected");

            stompClient.subscribe(
                `/topic/document/${documentId}`,
                (message) => {
                    const data = JSON.parse(message.body);

                    onMessageReceived(data);
                }
            );
        },

        onStompError: (frame) => {
            console.error("STOMP error:", frame);
        },

        onWebSocketError: (error) => {
            console.error("WebSocket error:", error);
        }
    });

    stompClient.activate();
};


export const sendDocumentUpdate = (
    documentId,
    userId,
    content
) => {

    if (stompClient && stompClient.connected) {

        stompClient.publish({
            destination: `/app/document/${documentId}`,

            body: JSON.stringify({
                documentId: documentId,
                userId: userId,
                content: content
            })
        });
    }
};


export const disconnectWebSocket = () => {

    if (stompClient) {
        stompClient.deactivate();
        stompClient = null;
    }
};