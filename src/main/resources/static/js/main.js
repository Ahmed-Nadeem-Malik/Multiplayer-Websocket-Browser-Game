import { connectWebSocket, dotRegistry, isSocketOpen, localPlayer, playerRegistry, requestReset, sendInputState, setDisconnectHandler, setEliminationHandler, setGameOverHandler, setReconnectEnabled, } from "./websocket.js";
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
    active: false, renderLoopStarted: false, inputIntervalId: null, elimination: {
        inProgress: false, startTime: null, frozenCameraPosition: null,
    },
    gameOver: false,
    pendingMenuTitle: null,
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
    const normalizeMovementKey = (rawKey) => {
        switch (rawKey) {
            case "w":
            case "arrowup":
                return "w";
            case "a":
            case "arrowleft":
                return "a";
            case "s":
            case "arrowdown":
                return "s";
            case "d":
            case "arrowright":
                return "d";
            default:
                return null;
        }
    };
    document.addEventListener("keydown", (event) => {
        if (!gameState.active)
            return;
        const key = event.key.toLowerCase();
        if (!isMovementKey(key))
            return;
        const normalizedKey = normalizeMovementKey(key);
        if (!normalizedKey)
            return;
        if (!movementState[normalizedKey]) {
            movementState[normalizedKey] = true;
            sendInputState();
        }
    });
    document.addEventListener("keyup", (event) => {
        if (!gameState.active)
            return;
        const key = event.key.toLowerCase();
        if (!isMovementKey(key))
            return;
        const normalizedKey = normalizeMovementKey(key);
        if (!normalizedKey)
            return;
        if (movementState[normalizedKey]) {
            movementState[normalizedKey] = false;
            sendInputState();
        }
    });
};
const resizeCanvas = () => {
    const pixelRatio = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = Math.floor(width * pixelRatio);
    canvas.height = Math.floor(height * pixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
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
    return {
        x: localPlayer.getX(), y: localPlayer.getY(),
    };
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
    const socketOpen = isSocketOpen();
    gameState.elimination.inProgress = false;
    gameState.elimination.startTime = null;
    gameState.elimination.frozenCameraPosition = null;
    gameState.gameOver = false;
    gameState.pendingMenuTitle = null;
    playerRegistry.clear();
    dotRegistry.clear();
    if (!socketOpen) {
        localPlayer.reset();
    }
    gameState.active = true;
    setReconnectEnabled(true);
    hideMenu();
    if (!socketOpen) {
        connectWebSocket(config);
    }
    startInputLoop();
    startRenderLoopOnce();
};
const handleElimination = () => {
    if (gameState.elimination.inProgress) {
        return;
    }
    gameState.elimination.inProgress = true;
    gameState.elimination.startTime = performance.now();
    gameState.elimination.frozenCameraPosition = {
        x: localPlayer.getX(), y: localPlayer.getY(),
    };
    gameState.active = false;
    resetMovementState();
    stopInputLoop();
    setReconnectEnabled(false);
    window.setTimeout(() => {
        gameState.elimination.inProgress = false;
        gameState.elimination.startTime = null;
        const title = gameState.pendingMenuTitle ?? "Play Again";
        setMenuState(title, "Play Again");
    }, ELIMINATION_FREEZE_MS);
};
const handleGameOver = (result) => {
    if (gameState.gameOver) {
        return;
    }
    const title = result === "win" ? "You are the winner" : "You lost";
    gameState.gameOver = true;
    gameState.pendingMenuTitle = title;
    gameState.active = false;
    resetMovementState();
    stopInputLoop();
    setReconnectEnabled(false);
    const config = getPlayerConfig();
    requestReset(config);
    if (gameState.elimination.inProgress) {
        return;
    }
    setMenuState(title, "Play Again");
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
setGameOverHandler(handleGameOver);
window.addEventListener("resize", resizeCanvas);
startButton?.addEventListener("click", startGame);
