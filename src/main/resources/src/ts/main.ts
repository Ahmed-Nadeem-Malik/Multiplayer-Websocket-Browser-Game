import {
    connectWebSocket,
    dotRegistry,
    localPlayer,
    PlayerConfig,
    playerRegistry,
    sendInputState,
    setDisconnectHandler,
    setEliminationHandler,
    setReconnectEnabled,
} from "./websocket.js";
import {canvas, context, movementState} from "./game.js";
import {CameraPosition, isMovementKey, startRenderLoop} from "./utils.js";

const DEFAULT_NAME = "undefined";
const DISCONNECT_MENU_DELAY_MS = 200;
const ELIMINATION_FREEZE_MS = 3000;

const menuOverlay = document.getElementById("menuOverlay") as HTMLElement | null;
const menuTitle = document.getElementById("menuTitle") as HTMLElement | null;
const startButton = document.getElementById("startButton") as HTMLButtonElement | null;
const nameInput = document.getElementById("playerName") as HTMLInputElement | null;
const colorButtons = Array.from(document.querySelectorAll<HTMLButtonElement>(".color-swatch"));

type EliminationState = {
    inProgress: boolean;
    startTime: number | null;
    frozenCameraPosition: CameraPosition | null;
};

const gameState = {
    active: false,
    renderLoopStarted: false,
    inputIntervalId: null as number | null,
    elimination: {
        inProgress: false,
        startTime: null,
        frozenCameraPosition: null,
    } as EliminationState,
};

let selectedColour = colorButtons[0]?.dataset.colour ?? "#B03030";

const initColourPicker = (): void => {
    if (colorButtons.length === 0) {
        return;
    }

    const applySelection = (button: HTMLButtonElement): void => {
        colorButtons.forEach((swatch) => swatch.classList.remove("selected"));
        button.classList.add("selected");
        selectedColour = button.dataset.colour ?? selectedColour;
    };

    colorButtons.forEach((button) => {
        button.addEventListener("click", () => applySelection(button));
    });

    applySelection(colorButtons[0]);
};

const resetMovementState = (): void => {
    movementState.w = false;
    movementState.a = false;
    movementState.s = false;
    movementState.d = false;
};

const registerMovementHandlers = (): void => {
    document.addEventListener("keydown", (event: KeyboardEvent) => {
        if (!gameState.active) return;
        const key = event.key.toLowerCase();
        if (!isMovementKey(key)) return;

        if (!movementState[key]) {
            movementState[key] = true;
            sendInputState();
        }
    });

    document.addEventListener("keyup", (event: KeyboardEvent) => {
        if (!gameState.active) return;
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
        name: rawName.length > 0 ? rawName : DEFAULT_NAME, colour: selectedColour,
    };
};

const setMenuState = (title: string, buttonText: string): void => {
    if (menuTitle) {
        menuTitle.textContent = title;
    }
    if (startButton) {
        startButton.textContent = buttonText;
    }
    menuOverlay?.classList.remove("hidden");
};

const hideMenu = (): void => {
    menuOverlay?.classList.add("hidden");
};

const getCameraPosition = (): CameraPosition => {
    if (gameState.elimination.inProgress && gameState.elimination.frozenCameraPosition) {
        return gameState.elimination.frozenCameraPosition;
    }

    return {x: localPlayer.getX(), y: localPlayer.getY()};
};

const getLocalPlayerAlpha = (): number => {
    if (!gameState.elimination.inProgress || gameState.elimination.startTime === null) {
        return 1;
    }

    const elapsed = performance.now() - gameState.elimination.startTime;
    return Math.max(0, 1 - elapsed / ELIMINATION_FREEZE_MS);
};

const startRenderLoopOnce = (): void => {
    if (gameState.renderLoopStarted) {
        return;
    }

    gameState.renderLoopStarted = true;
    startRenderLoop(
        playerRegistry,
        dotRegistry,
        localPlayer,
        context,
        canvas,
        getCameraPosition,
        getLocalPlayerAlpha,
    );
};

const startInputLoop = (): void => {
    if (gameState.inputIntervalId !== null) {
        return;
    }

    gameState.inputIntervalId = window.setInterval(sendInputState, 1);
};

const stopInputLoop = (): void => {
    if (gameState.inputIntervalId === null) {
        return;
    }

    window.clearInterval(gameState.inputIntervalId);
    gameState.inputIntervalId = null;
};

const startGame = (): void => {
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

const handleElimination = (): void => {
    if (gameState.elimination.inProgress) {
        return;
    }

    gameState.elimination.inProgress = true;
    gameState.elimination.startTime = performance.now();
    gameState.elimination.frozenCameraPosition = {x: localPlayer.getX(), y: localPlayer.getY()};
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

const handleDisconnect = (): void => {
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
