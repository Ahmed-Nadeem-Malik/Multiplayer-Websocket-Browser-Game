import { inputState } from "./state.js";
const wsURI = "ws://localhost:8080/movement";
let webSocket = null;
export function connectWebSocket() {
    if (webSocket && (webSocket.readyState === WebSocket.OPEN || webSocket.readyState === WebSocket.CONNECTING)) {
        return;
    }
    webSocket = new WebSocket(wsURI);
    webSocket.addEventListener("open", () => {
        console.log("WebSocket connected");
    });
    webSocket.addEventListener("message", (e) => {
        const msg = JSON.parse(e.data);
        console.log("========================================================");
        console.log(msg.id);
        console.log("========================================================");
    });
    webSocket.addEventListener("close", () => {
        console.log("WebSocket closed - reconnecting...");
        webSocket = null;
        setTimeout(connectWebSocket, 1000);
    });
    webSocket.addEventListener("error", () => {
        console.log("WebSocket error");
    });
}
export function sendInputState() {
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN)
        return;
    webSocket.send(JSON.stringify({
        type: "input", ...inputState,
    }));
}
