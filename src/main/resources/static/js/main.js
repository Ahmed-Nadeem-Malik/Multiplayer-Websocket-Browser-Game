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
const gameState = {
    active: false,
    renderLoopStarted: false,
    inputIntervalId: null,
    elimination: {
        inProgress: false,
        startTime: null,
        frozenCameraPosition: null,
    },
};
let selectedColour = colorButtons[0]?.dataset.colour ?? "#B03030";
const initColourPicker = () => {
    if (colorButtons.length === 0) {
        return;
    }
    const applySelection = (button) => {
        colorButtons.forEach((swatch) => swatch.classList.remove("selected"));
        button.classList.add("selected");
        selectedColour = button.dataset.colour ?? selectedColour;
    };
    colorButtons.forEach((button) => {
        button.addEventListener("click", () => applySelection(button));
    });
    applySelection(colorButtons[0]);
};
const resetMovementState = () => {
    movementState.w = false;
    movementState.a = false;
    movementState.s = false;
    movementState.d = false;
};
const registerMovementHandlers = () => {
    document.addEventListener("keydown", (event) => {
        if (!gameState.active)
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
        if (!gameState.active)
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
        name: rawName.length > 0 ? rawName : DEFAULT_NAME, colour: selectedColour,
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
    if (gameState.elimination.inProgress && gameState.elimination.frozenCameraPosition) {
        return gameState.elimination.frozenCameraPosition;
    }
    return { x: localPlayer.getX(), y: localPlayer.getY() };
};
const getLocalPlayerAlpha = () => {
    if (!gameState.elimination.inProgress || gameState.elimination.startTime === null) {
        return 1;
    }
    const elapsed = performance.now() - gameState.elimination.startTime;
    return Math.max(0, 1 - elapsed / ELIMINATION_FREEZE_MS);
};
const startRenderLoopOnce = () => {
    if (gameState.renderLoopStarted) {
        return;
    }
    gameState.renderLoopStarted = true;
    startRenderLoop(playerRegistry, dotRegistry, localPlayer, context, canvas, getCameraPosition, getLocalPlayerAlpha);
};
const startInputLoop = () => {
    if (gameState.inputIntervalId !== null) {
        return;
    }
    gameState.inputIntervalId = window.setInterval(sendInputState, 1);
};
const stopInputLoop = () => {
    if (gameState.inputIntervalId === null) {
        return;
    }
    window.clearInterval(gameState.inputIntervalId);
    gameState.inputIntervalId = null;
};
const startGame = () => {
    const config = getPlayerConfig();
    gameState.elimination.inProgress = false;
    gameState.elimination.startTime = null;
    gameState.elimination.frozenCameraPosition = null;
    gameState.active = true;
    setReconnectEnabled(true);
    hideMenu();
    connectWebSocket(config);
    startInputLoop();
    startRenderLoopOnce();
};
const handleElimination = () => {
    if (gameState.elimination.inProgress) {
        return;
    }
    gameState.elimination.inProgress = true;
    gameState.elimination.startTime = performance.now();
    gameState.elimination.frozenCameraPosition = { x: localPlayer.getX(), y: localPlayer.getY() };
    gameState.active = false;
    resetMovementState();
    stopInputLoop();
    setReconnectEnabled(false);
    window.setTimeout(() => {
        gameState.elimination.inProgress = false;
        gameState.elimination.startTime = null;
        setMenuState("Play Again", "Play Again");
    }, ELIMINATION_FREEZE_MS);
};
const handleDisconnect = () => {
    if (gameState.elimination.inProgress) {
        return;
    }
    gameState.active = false;
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
