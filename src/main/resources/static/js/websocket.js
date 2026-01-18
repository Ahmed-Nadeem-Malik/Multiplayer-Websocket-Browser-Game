import { inputState, Player, Players } from "./game.js";
/**
 * WebSocket endpoint for movement messages.
 */
const wsURI = "ws://localhost:8080/movement";
/**
 * Active WebSocket connection instance.
 */
let webSocket = null;
/**
 * Local player instance synced with server messages.
 */
export const player = new Player();
export const players = new Players();
/**
 * Connects to the WebSocket server with auto-reconnect.
 */
export function connectWebSocket() {
    if (webSocket && (webSocket.readyState === WebSocket.OPEN || webSocket.readyState === WebSocket.CONNECTING)) {
        return;
    }
    webSocket = new WebSocket(wsURI);
    /**
     * Logs successful WebSocket connection.
     */
    webSocket.addEventListener("open", () => {
        console.log("WebSocket connected");
    });
    /**
     * Applies server initialization messages.
     */
    webSocket.addEventListener("message", (e) => {
        const msg = JSON.parse(e.data);
        switch (msg.type) {
            case "InitPlayer":
                player.hydrate(msg.player);
                break;
            case "InitPlayers":
                players.hydrate(msg.players);
                console.log(players);
                break;
        }
    });
    /**
     * Handles reconnect on close.
     */
    webSocket.addEventListener("close", () => {
        console.log("WebSocket closed - reconnecting...");
        webSocket = null;
        setTimeout(connectWebSocket, 1000);
    });
    /**
     * Logs WebSocket errors.
     */
    webSocket.addEventListener("error", () => {
        console.log("WebSocket error");
    });
}
/**
 * Sends the current input state to the server.
 */
export function sendInputState() {
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN)
        return;
    const id = player.getId();
    if (!id)
        return;
    webSocket.send(JSON.stringify({
        type: "input",
        id,
        ...inputState,
    }));
}
