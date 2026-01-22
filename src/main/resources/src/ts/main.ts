import {connectWebSocket, dotRegistry, localPlayer, PlayerConfig, playerRegistry, sendInputState} from "./websocket.js";
import {canvas, context, movementState} from "./game.js";
import {isMovementKey, startRenderLoop} from "./utils.js";

const DEFAULT_NAME = "undefined";

const menuOverlay = document.getElementById("menuOverlay") as HTMLElement | null;
const startButton = document.getElementById("startButton") as HTMLButtonElement | null;
const nameInput = document.getElementById("playerName") as HTMLInputElement | null;
const colorButtons = Array.from(document.querySelectorAll<HTMLButtonElement>(".color-swatch"));

let selectedColour = colorButtons[0]?.dataset.colour ?? "#B03030";

const setSelectedColour = (button: HTMLButtonElement): void => {
    colorButtons.forEach((swatch) => swatch.classList.remove("selected"));
    button.classList.add("selected");
    selectedColour = button.dataset.colour ?? selectedColour;
};

const initColourPicker = (): void => {
    if (colorButtons.length === 0) {
        return;
    }

    colorButtons.forEach((button) => {
        button.addEventListener("click", () => setSelectedColour(button));
    });

    setSelectedColour(colorButtons[0]);
};

const registerMovementHandlers = (): void => {
    document.addEventListener("keydown", (event: KeyboardEvent) => {
        const key = event.key.toLowerCase();
        if (!isMovementKey(key)) return;

        if (!movementState[key]) {
            movementState[key] = true;
            sendInputState();
        }
    });

    document.addEventListener("keyup", (event: KeyboardEvent) => {
        const key = event.key.toLowerCase();
        if (!isMovementKey(key)) return;

        if (movementState[key]) {
            movementState[key] = false;
            sendInputState();
        }
    });
};

const resizeCanvas = (): void => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
};

const getPlayerConfig = (): PlayerConfig => {
    const rawName = nameInput?.value.trim() ?? "";

    return {
        name: rawName.length > 0 ? rawName : DEFAULT_NAME,
        colour: selectedColour,
    };
};

const startGame = (): void => {
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
