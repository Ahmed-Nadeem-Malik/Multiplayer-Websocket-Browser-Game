import { connectWebSocket, dotRegistry, localPlayer, playerRegistry, sendInputState } from "./websocket.js";
import { canvas, context, movementState } from "./game.js";
import { isMovementKey, startRenderLoop } from "./utils.js";
const menuOverlay = document.getElementById("menuOverlay");
const startButton = document.getElementById("startButton");
const nameInput = document.getElementById("playerName");
const colorButtons = Array.from(document.querySelectorAll(".color-swatch"));
let selectedColour = colorButtons[0]?.dataset.colour ?? "#B03030";
const setSelectedColour = (button) => {
    colorButtons.forEach((swatch) => swatch.classList.remove("selected"));
    button.classList.add("selected");
    selectedColour = button.dataset.colour ?? selectedColour;
};
colorButtons.forEach((button) => {
    button.addEventListener("click", () => setSelectedColour(button));
});
if (colorButtons.length > 0) {
    setSelectedColour(colorButtons[0]);
}
const registerMovementHandlers = () => {
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
};
const resizeCanvas = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
};
const startGame = () => {
    const name = nameInput?.value.trim() || "undefined";
    const config = { name, colour: selectedColour };
    menuOverlay?.classList.add("hidden");
    registerMovementHandlers();
    connectWebSocket(config);
    setInterval(sendInputState, 1);
    startRenderLoop(playerRegistry, dotRegistry, localPlayer, context, canvas);
};
resizeCanvas();
window.addEventListener("resize", resizeCanvas);
startButton?.addEventListener("click", startGame);
