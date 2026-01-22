import { connectWebSocket, dotRegistry, localPlayer, playerRegistry, sendInputState } from "./websocket.js";
import { canvas, context, movementState } from "./game.js";
import { isMovementKey, startRenderLoop } from "./utils.js";
document.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (!isMovementKey(key))
        return;
    if (!movementState[key]) {
        movementState[key] = true;
        sendInputState();
    }
});
document.addEventListener("keyup", (event) => {
    const key = event.key.toLowerCase();
    if (!isMovementKey(key))
        return;
    if (movementState[key]) {
        movementState[key] = false;
        sendInputState();
    }
});
const resizeCanvas = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
};
resizeCanvas();
window.addEventListener("resize", resizeCanvas);
connectWebSocket();
setInterval(sendInputState, 1);
startRenderLoop(playerRegistry, dotRegistry, localPlayer, context, canvas);
