import { Dots, movementState, Player, Players } from "./game.js";
const webSocketUrl = "ws://localhost:8080/movement";
let socket = null;
let playerConfig = null;
let reconnectEnabled = true;
let disconnectHandler = null;
let eliminationHandler = null;
export const localPlayer = new Player();
export const playerRegistry = new Players();
export const dotRegistry = new Dots();
export const setReconnectEnabled = (enabled) => {
    reconnectEnabled = enabled;
};
export const setDisconnectHandler = (handler) => {
    disconnectHandler = handler;
};
export const setEliminationHandler = (handler) => {
    eliminationHandler = handler;
};
const isSocketActive = () => {
    return !!socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING);
};
const sendConfig = () => {
    if (!socket || !playerConfig) {
        return;
    }
    socket.send(JSON.stringify({
        type: "InitConfig",
        ...playerConfig,
    }));
};
const updateLocalPlayer = (players) => {
    const localId = localPlayer.getId();
    if (!localId) {
        return;
    }
    const snapshot = players[localId];
    if (snapshot) {
        localPlayer.applySnapshot(snapshot);
    }
};
const handlePlayersSnapshot = (players) => {
    playerRegistry.applySnapshot(players);
    updateLocalPlayer(players);
};
const handleServerMessage = (message) => {
    switch (message.type) {
        case "InitPlayer":
            localPlayer.applySnapshot(message.player);
            break;
        case "InitPlayers":
            handlePlayersSnapshot(message.players);
            break;
        case "UpdatePlayers":
            handlePlayersSnapshot(message.players);
            break;
        case "InitDots":
            dotRegistry.applySnapshot(message.dots);
            break;
        case "UpdateDots":
            dotRegistry.applyUpdates(message.dots);
            break;
        case "Eliminated": {
            const localId = localPlayer.getId();
            if (localId && message.playerId === localId && !playerRegistry.getAll()[localId]) {
                eliminationHandler?.();
            }
            break;
        }
    }
};
const scheduleReconnect = () => {
    setTimeout(() => connectWebSocket(), 1000);
};
/**
 * Connects to the WebSocket server and retries on close.
 */
export function connectWebSocket(config) {
    if (config) {
        playerConfig = config;
    }
    if (!playerConfig || isSocketActive()) {
        return;
    }
    socket = new WebSocket(webSocketUrl);
    socket.addEventListener("open", () => {
        console.log("WebSocket connected");
        sendConfig();
    });
    socket.addEventListener("message", (event) => {
        const message = JSON.parse(event.data);
        handleServerMessage(message);
    });
    socket.addEventListener("close", () => {
        console.log("WebSocket closed - reconnecting...");
        socket = null;
        disconnectHandler?.();
        if (reconnectEnabled) {
            scheduleReconnect();
        }
        else {
            playerConfig = null;
        }
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
        type: "input",
        id: playerId,
        ...movementState,
    }));
}
