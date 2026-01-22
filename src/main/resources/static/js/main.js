import { connectWebSocket, dotRegistry, localPlayer, playerRegistry, sendInputState, setDisconnectHandler, setEliminationHandler, setReconnectEnabled, } from "./websocket.js";
import { canvas, context, movementState } from "./game.js";
import { isMovementKey, startRenderLoop } from "./utils.js";
const DEFAULT_NAME = "undefined";
const DISCONNECT_MENU_DELAY_MS = 200;
const ELIMINATION_FREEZE_MS = 3000;
const menuOverlay = document.getElementById("menuOverlay");
const menuTitle = document.getElementById("menuTitle");
const startButton = document.getElementById("startButton");
const nameInput = document.getElementById("playerName");
const colorButtons = Array.from(document.querySelectorAll(".color-swatch"));
let selectedColour = colorButtons[0]?.dataset.colour ?? "#B03030";
let gameActive = false;
let inputIntervalId = null;
let renderLoopStarted = false;
let eliminationInProgress = false;
let eliminationStartTime = null;
let frozenCameraPosition = null;
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
const resetMovementState = () => {
    movementState.w = false;
    movementState.a = false;
    movementState.s = false;
    movementState.d = false;
};
const registerMovementHandlers = () => {
    document.addEventListener("keydown", (event) => {
        if (!gameActive)
            return;
        const key = event.key.toLowerCase();
        if (!isMovementKey(key))
            return;
        if (!movementState[key]) {
            movementState[key] = true;
            sendInputState();
        }
    });
    document.addEventListener("keyup", (event) => {
        if (!gameActive)
            return;
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
const setMenuState = (title, buttonText) => {
    if (menuTitle) {
        menuTitle.textContent = title;
    }
    if (startButton) {
        startButton.textContent = buttonText;
    }
    menuOverlay?.classList.remove("hidden");
};
const hideMenu = () => {
    menuOverlay?.classList.add("hidden");
};
const getCameraPosition = () => {
    if (eliminationInProgress && frozenCameraPosition) {
        return frozenCameraPosition;
    }
    return { x: localPlayer.getX(), y: localPlayer.getY() };
};
const getLocalPlayerAlpha = () => {
    if (!eliminationInProgress || eliminationStartTime === null) {
        return 1;
    }
    const elapsed = performance.now() - eliminationStartTime;
    return Math.max(0, 1 - elapsed / ELIMINATION_FREEZE_MS);
};
const startRenderLoopOnce = () => {
    if (renderLoopStarted) {
        return;
    }
    renderLoopStarted = true;
    startRenderLoop(playerRegistry, dotRegistry, localPlayer, context, canvas, getCameraPosition, getLocalPlayerAlpha);
};
const ensureInputLoop = () => {
    if (inputIntervalId !== null) {
        return;
    }
    inputIntervalId = window.setInterval(sendInputState, 1);
};
const stopInputLoop = () => {
    if (inputIntervalId === null) {
        return;
    }
    window.clearInterval(inputIntervalId);
    inputIntervalId = null;
};
const startGame = () => {
    const config = getPlayerConfig();
    eliminationInProgress = false;
    eliminationStartTime = null;
    frozenCameraPosition = null;
    gameActive = true;
    setReconnectEnabled(true);
    hideMenu();
    connectWebSocket(config);
    ensureInputLoop();
    startRenderLoopOnce();
};
const handleElimination = () => {
    if (eliminationInProgress) {
        return;
    }
    eliminationInProgress = true;
    eliminationStartTime = performance.now();
    gameActive = false;
    frozenCameraPosition = { x: localPlayer.getX(), y: localPlayer.getY() };
    resetMovementState();
    stopInputLoop();
    setReconnectEnabled(false);
    window.setTimeout(() => {
        eliminationInProgress = false;
        eliminationStartTime = null;
        setMenuState("Play Again", "Play Again");
    }, ELIMINATION_FREEZE_MS);
};
const handleDisconnect = () => {
    if (eliminationInProgress) {
        return;
    }
    gameActive = false;
    resetMovementState();
    stopInputLoop();
    setReconnectEnabled(false);
    window.setTimeout(() => {
        setMenuState("Play Again", "Play Again");
    }, DISCONNECT_MENU_DELAY_MS);
};
resizeCanvas();
initColourPicker();
registerMovementHandlers();
setDisconnectHandler(handleDisconnect);
setEliminationHandler(handleElimination);
window.addEventListener("resize", resizeCanvas);
startButton?.addEventListener("click", startGame);
