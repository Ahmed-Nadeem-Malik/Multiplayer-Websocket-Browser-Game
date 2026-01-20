import {movementState, Player, Players, PlayerSnapshot} from "./game.js";

const webSocketUrl = "ws://localhost:8080/movement";

let socket: WebSocket | null = null;

export const localPlayer = new Player();

export const playerRegistry = new Players();

/**
 * Connects to the WebSocket server and retries on close.
 */
export function connectWebSocket(): void {
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
        return;
    }

    socket = new WebSocket(webSocketUrl);

    socket.addEventListener("open", () => {
        console.log("WebSocket connected");
    });

    socket.addEventListener("message", (event: MessageEvent) => {
        const message = JSON.parse(event.data as string) as InitMessage;
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
        }
    });

    socket.addEventListener("close", () => {
        console.log("WebSocket closed - reconnecting...");
        socket = null;
        setTimeout(connectWebSocket, 1000);
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
        type: "input",
        id: playerId,
        ...movementState,
    }));
}

/**
 * Message payload for initializing player identity.
 */
type InitMessage =
    | { type: "InitPlayer"; player: PlayerSnapshot }
    | { type: "InitPlayers"; players: Record<string, PlayerSnapshot> };


