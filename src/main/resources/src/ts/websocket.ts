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

/**
 * Connects to the WebSocket server and retries on close.
 */
export function connectWebSocket(config?: PlayerConfig): void {
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
        socket?.send(JSON.stringify({type: "InitConfig", ...playerConfig}));
    });

    socket.addEventListener("message", (event: MessageEvent) => {
        const message = JSON.parse(event.data as string) as ServerMessage;
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
