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

let selectedColour = colorButtons[0]?.dataset.colour ?? "#B03030";
let gameActive = false;
let inputIntervalId: number | null = null;
let renderLoopStarted = false;
let eliminationInProgress = false;
let eliminationStartTime: number | null = null;
let frozenCameraPosition: CameraPosition | null = null;

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

const resetMovementState = (): void => {
    movementState.w = false;
    movementState.a = false;
    movementState.s = false;
    movementState.d = false;
};

const registerMovementHandlers = (): void => {
    document.addEventListener("keydown", (event: KeyboardEvent) => {
        if (!gameActive) return;
        const key = event.key.toLowerCase();
        if (!isMovementKey(key)) return;

        if (!movementState[key]) {
            movementState[key] = true;
            sendInputState();
        }
    });

    document.addEventListener("keyup", (event: KeyboardEvent) => {
        if (!gameActive) return;
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
    if (eliminationInProgress && frozenCameraPosition) {
        return frozenCameraPosition;
    }

    return {x: localPlayer.getX(), y: localPlayer.getY()};
};

const getLocalPlayerAlpha = (): number => {
    if (!eliminationInProgress || eliminationStartTime === null) {
        return 1;
    }

    const elapsed = performance.now() - eliminationStartTime;
    return Math.max(0, 1 - elapsed / ELIMINATION_FREEZE_MS);
};

const startRenderLoopOnce = (): void => {
    if (renderLoopStarted) {
        return;
    }

    renderLoopStarted = true;
    startRenderLoop(playerRegistry, dotRegistry, localPlayer, context, canvas, getCameraPosition, getLocalPlayerAlpha,);
};

const ensureInputLoop = (): void => {
    if (inputIntervalId !== null) {
        return;
    }

    inputIntervalId = window.setInterval(sendInputState, 1);
};

const stopInputLoop = (): void => {
    if (inputIntervalId === null) {
        return;
    }

    window.clearInterval(inputIntervalId);
    inputIntervalId = null;
};

const startGame = (): void => {
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

const handleElimination = (): void => {
    if (eliminationInProgress) {
        return;
    }

    eliminationInProgress = true;
    eliminationStartTime = performance.now();
    gameActive = false;
    frozenCameraPosition = {x: localPlayer.getX(), y: localPlayer.getY()};
    resetMovementState();
    stopInputLoop();
    setReconnectEnabled(false);

    window.setTimeout(() => {
        eliminationInProgress = false;
        eliminationStartTime = null;
        setMenuState("Play Again", "Play Again");
    }, ELIMINATION_FREEZE_MS);
};

const handleDisconnect = (): void => {
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
