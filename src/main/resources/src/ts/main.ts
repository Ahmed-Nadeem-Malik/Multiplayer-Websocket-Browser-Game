/**
 * Entry point that wires input handling and the game loop.
 */
import {connectWebSocket, player, sendInputState} from "./websocket.js";
import {canvas, ctx, inputState} from "./game.js";
import {isMovementKey, startGameLoop} from "./utils.js";

/**
 * Tracks movement key presses and forwards updates.
 */
document.addEventListener("keydown", (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    if (!isMovementKey(k)) return;

    if (!inputState[k]) {
        inputState[k] = true;
        sendInputState();
    }
});

/**
 * Tracks movement key releases and forwards updates.
 */
document.addEventListener("keyup", (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    if (!isMovementKey(k)) return;

    if (inputState[k]) {
        inputState[k] = false;
        sendInputState();
    }
});

connectWebSocket();
startGameLoop(player, inputState, ctx, canvas);
