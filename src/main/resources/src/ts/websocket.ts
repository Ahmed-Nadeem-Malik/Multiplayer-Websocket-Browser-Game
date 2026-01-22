import {Dots, DotSnapshot, movementState, Player, Players, PlayerSnapshot} from "./game.js";

const webSocketUrl = "ws://localhost:8080/movement";

let socket: WebSocket | null = null;
let playerConfig: PlayerConfig | null = null;

export const localPlayer = new Player();

export const playerRegistry = new Players();

export const dotRegistry = new Dots();

export type PlayerConfig = {
    name: string;
    colour: string;
};

const isSocketActive = (): boolean => {
    return !!socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING);
};

const sendConfig = (): void => {
    if (!socket || !playerConfig) {
        return;
    }

    socket.send(JSON.stringify({type: "InitConfig", ...playerConfig}));
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
        scheduleReconnect();
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

    socket.send(JSON.stringify({
        type: "input", id: playerId, ...movementState,
    }));
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

type ServerMessage = InitMessage | UpdatePlayersMessage | UpdateDotsMessage;
