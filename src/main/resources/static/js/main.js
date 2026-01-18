/**
 * Entry point that wires input handling and the game loop.
 */
import { connectWebSocket, player, players, sendInputState } from "./websocket.js";
import { canvas, ctx, inputState } from "./game.js";
import { isMovementKey, startGameLoop } from "./utils.js";
/**
 * Tracks movement key presses and forwards updates.
 */
document.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if (!isMovementKey(k))
        return;
    if (!inputState[k]) {
        inputState[k] = true;
        sendInputState();
    }
});
/**
 * Tracks movement key releases and forwards updates.
 */
document.addEventListener("keyup", (e) => {
    const k = e.key.toLowerCase();
    if (!isMovementKey(k))
        return;
    if (inputState[k]) {
        inputState[k] = false;
        sendInputState();
    }
});
connectWebSocket();
setInterval(sendInputState, 1);
startGameLoop(player, players, inputState, ctx, canvas);
