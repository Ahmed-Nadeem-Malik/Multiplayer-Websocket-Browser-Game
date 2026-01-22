import { Dots, movementState, Player, Players } from "./game.js";
const webSocketUrl = "ws://localhost:8080/movement";
let socket = null;
let playerConfig = null;
export const localPlayer = new Player();
export const playerRegistry = new Players();
export const dotRegistry = new Dots();
/**
 * Connects to the WebSocket server and retries on close.
 */
export function connectWebSocket(config) {
    if (config) {
        playerConfig = config;
    }
    if (!playerConfig) {
        return;
    }
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
        return;
    }
    socket = new WebSocket(webSocketUrl);
    socket.addEventListener("open", () => {
        console.log("WebSocket connected");
        socket?.send(JSON.stringify({ type: "InitConfig", ...playerConfig }));
    });
    socket.addEventListener("message", (event) => {
        const message = JSON.parse(event.data);
        switch (message.type) {
            case "InitPlayer":
                localPlayer.applySnapshot(message.player);
                break;
            case "InitPlayers":
                playerRegistry.applySnapshot(message.players);
                const localId = localPlayer.getId();
                if (localId) {
                    const snapshot = message.players[localId];
                    if (snapshot) {
                        localPlayer.applySnapshot(snapshot);
                    }
                }
                break;
            case "UpdatePlayers":
                playerRegistry.applySnapshot(message.players);
                const updatedLocalId = localPlayer.getId();
                if (updatedLocalId) {
                    const snapshot = message.players[updatedLocalId];
                    if (snapshot) {
                        localPlayer.applySnapshot(snapshot);
                    }
                }
                break;
            case "InitDots":
                dotRegistry.applySnapshot(message.dots);
                break;
            case "UpdateDots":
                dotRegistry.applyUpdates(message.dots);
                break;
        }
    });
    socket.addEventListener("close", () => {
        console.log("WebSocket closed - reconnecting...");
        socket = null;
        setTimeout(() => connectWebSocket(), 1000);
    });
    socket.addEventListener("error", () => {
        console.log("WebSocket error");
    });
}
/**
 * Sends the current input state when the socket is open.
 */
export function sendInputState() {
    if (!socket || socket.readyState !== WebSocket.OPEN)
        return;
    const playerId = localPlayer.getId();
    if (!playerId)
        return;
    socket.send(JSON.stringify({
        type: "input", id: playerId, ...movementState,
    }));
}
