import { Dots, movementState, Player, Players } from "./game.js";
const webSocketUrl = "ws://localhost:8080/movement";
let socket = null;
let playerConfig = null;
let reconnectEnabled = true;
let manualDisconnect = false;
let disconnectHandler = null;
let eliminationHandler = null;
let gameOverHandler = null;
let roundResetHandler = null;
let gameOverEmitted = false;
let maxPlayersSeen = 0;
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
export const setGameOverHandler = (handler) => {
    gameOverHandler = handler;
};
export const setRoundResetHandler = (handler) => {
    roundResetHandler = handler;
};
export const disconnectWebSocket = () => {
    if (!socket) {
        return;
    }
    manualDisconnect = true;
    socket.close();
};
export const reconnectWebSocket = (config) => {
    playerConfig = config;
    gameOverEmitted = false;
    maxPlayersSeen = 0;
    if (socket) {
        manualDisconnect = true;
        socket.close();
        socket = null;
    }
    connectWebSocket();
};
export const requestReset = (config) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        return false;
    }
    playerConfig = config;
    gameOverEmitted = false;
    maxPlayersSeen = 0;
    socket.send(JSON.stringify({
        type: "Reset",
        ...playerConfig,
    }));
    return true;
};
const isSocketActive = () => {
    return !!socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING);
};
export const isSocketOpen = () => {
    return !!socket && socket.readyState === WebSocket.OPEN;
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
    evaluateGameOver(players);
};
const evaluateGameOver = (players) => {
    if (gameOverEmitted) {
        return;
    }
    const localId = localPlayer.getId();
    if (!localId) {
        return;
    }
    const playerIds = Object.keys(players);
    maxPlayersSeen = Math.max(maxPlayersSeen, playerIds.length);
    if (maxPlayersSeen < 2) {
        return;
    }
    if (playerIds.length !== 1) {
        return;
    }
    const remainingId = playerIds[0];
    if (remainingId === localId) {
        gameOverEmitted = true;
        gameOverHandler?.("win");
        return;
    }
    gameOverEmitted = true;
    gameOverHandler?.("loss");
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
            if (localId && message.playerId === localId) {
                eliminationHandler?.();
            }
            break;
        }
        case "ResetRound": {
            gameOverEmitted = false;
            maxPlayersSeen = 0;
            roundResetHandler?.();
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
        gameOverEmitted = false;
        maxPlayersSeen = 0;
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
        if (manualDisconnect) {
            manualDisconnect = false;
            return;
        }
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
