import { connectWebSocket, dotRegistry, localPlayer, playerRegistry, sendInputState } from "./websocket.js";
import { canvas, context, movementState } from "./game.js";
import { isMovementKey, startRenderLoop } from "./utils.js";
const DEFAULT_NAME = "undefined";
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
const initColourPicker = () => {
    if (colorButtons.length === 0) {
        return;
    }
    colorButtons.forEach((button) => {
        button.addEventListener("click", () => setSelectedColour(button));
    });
    setSelectedColour(colorButtons[0]);
};
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
const getPlayerConfig = () => {
    const rawName = nameInput?.value.trim() ?? "";
    return {
        name: rawName.length > 0 ? rawName : DEFAULT_NAME,
        colour: selectedColour,
    };
};
const startGame = () => {
    const config = getPlayerConfig();
    menuOverlay?.classList.add("hidden");
    registerMovementHandlers();
    connectWebSocket(config);
    setInterval(sendInputState, 1);
    startRenderLoop(playerRegistry, dotRegistry, localPlayer, context, canvas);
};
resizeCanvas();
initColourPicker();
window.addEventListener("resize", resizeCanvas);
startButton?.addEventListener("click", startGame);
