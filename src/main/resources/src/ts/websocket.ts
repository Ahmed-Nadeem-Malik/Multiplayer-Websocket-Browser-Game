import {Dots, DotSnapshot, movementState, Player, Players, PlayerSnapshot} from "./game.js";

const webSocketUrl = "ws://localhost:8080/movement";

let socket: WebSocket | null = null;
let playerConfig: PlayerConfig | null = null;
let reconnectEnabled = true;
let disconnectHandler: (() => void) | null = null;
let eliminationHandler: (() => void) | null = null;
let gameOverHandler: ((result: "win" | "loss") => void) | null = null;
let gameOverEmitted = false;
let maxPlayersSeen = 0;

export const localPlayer = new Player();

export const playerRegistry = new Players();

export const dotRegistry = new Dots();

export type PlayerConfig = {
    name: string;
    colour: string;
};

export const setReconnectEnabled = (enabled: boolean): void => {
    reconnectEnabled = enabled;
};

export const setDisconnectHandler = (handler: (() => void) | null): void => {
    disconnectHandler = handler;
};

export const setEliminationHandler = (handler: (() => void) | null): void => {
    eliminationHandler = handler;
};

export const setGameOverHandler = (handler: ((result: "win" | "loss") => void) | null): void => {
    gameOverHandler = handler;
};

export const requestReset = (config: PlayerConfig): boolean => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        return false;
    }

    playerConfig = config;
    gameOverEmitted = false;
    maxPlayersSeen = 0;
    socket.send(
        JSON.stringify({
            type: "Reset",
            ...playerConfig,
        }),
    );
    return true;
};

const isSocketActive = (): boolean => {
    return !!socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING);
};

export const isSocketOpen = (): boolean => {
    return !!socket && socket.readyState === WebSocket.OPEN;
};

const sendConfig = (): void => {
    if (!socket || !playerConfig) {
        return;
    }

    socket.send(
        JSON.stringify({
            type: "InitConfig",
            ...playerConfig,
        }),
    );
};

const updateLocalPlayer = (players: Record<string, PlayerSnapshot>): void => {
    const localId = localPlayer.getId();
    if (!localId) {
        return;
    }

    const snapshot = players[localId];
    if (snapshot) {
        localPlayer.applySnapshot(snapshot);
    }
};

const handlePlayersSnapshot = (players: Record<string, PlayerSnapshot>): void => {
    playerRegistry.applySnapshot(players);
    updateLocalPlayer(players);
    evaluateGameOver(players);
};

const evaluateGameOver = (players: Record<string, PlayerSnapshot>): void => {
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

const handleServerMessage = (message: ServerMessage): void => {
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
    }
};

const scheduleReconnect = (): void => {
    setTimeout(() => connectWebSocket(), 1000);
};

/**
 * Connects to the WebSocket server and retries on close.
 */
export function connectWebSocket(config?: PlayerConfig): void {
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

    socket.addEventListener("message", (event: MessageEvent) => {
        const message = JSON.parse(event.data as string) as ServerMessage;
        handleServerMessage(message);
    });

    socket.addEventListener("close", () => {
        console.log("WebSocket closed - reconnecting...");
        socket = null;
        disconnectHandler?.();

        if (reconnectEnabled) {
            scheduleReconnect();
        } else {
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
export function sendInputState(): void {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    const playerId = localPlayer.getId();
    if (!playerId) return;

    socket.send(
        JSON.stringify({
            type: "input",
            id: playerId,
            ...movementState,
        }),
    );
}

/**
 * Message payload for initializing player identity.
 */
type InitMessage =
    | { type: "InitPlayer"; player: PlayerSnapshot }
    | { type: "InitPlayers"; players: Record<string, PlayerSnapshot> }
    | { type: "InitDots"; dots: DotSnapshot[] };

type UpdatePlayersMessage = { type: "UpdatePlayers"; players: Record<string, PlayerSnapshot> };

type UpdateDotsMessage = { type: "UpdateDots"; dots: DotSnapshot[] };

type EliminatedMessage = { type: "Eliminated"; playerId: string };

type ServerMessage = InitMessage | UpdatePlayersMessage | UpdateDotsMessage | EliminatedMessage;
