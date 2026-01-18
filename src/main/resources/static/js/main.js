import { Player } from "./Player.js";
import { connectWebSocket, sendInputState } from "./websocket.js";
import { inputState } from "./state.js";
import { canvas, ctx } from "./rendering.js";
// -----------------------------
// Canvas + Player
// -----------------------------
const player = new Player();
// -----------------------------
// Input handling (booleans)
// -----------------------------
function isMovementKey(k) {
    return k === "w" || k === "a" || k === "s" || k === "d";
}
document.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if (!isMovementKey(k))
        return;
    // Avoid spamming repeats while held
    if (!inputState[k]) {
        inputState[k] = true;
        sendInputState();
    }
});
document.addEventListener("keyup", (e) => {
    const k = e.key.toLowerCase();
    if (!isMovementKey(k))
        return;
    if (inputState[k]) {
        inputState[k] = false;
        sendInputState();
    }
});
// -----------------------------
// Main loop
// -----------------------------
function loop() {
    player.update(inputState);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    player.draw();
    requestAnimationFrame(loop);
}
// -----------------------------
// Start
// -----------------------------
connectWebSocket();
requestAnimationFrame(loop);
