import {
    connectWebSocket,
    dotRegistry,
    isSocketOpen,
    localPlayer,
    PlayerConfig,
    playerRegistry,
    requestReset,
    sendInputState,
    setDisconnectHandler,
    setEliminationHandler,
    setGameOverHandler,
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
    inProgress: boolean; startTime: number | null; frozenCameraPosition: CameraPosition | null;
};

const gameState = {
    active: false, renderLoopStarted: false, inputIntervalId: null as number | null, elimination: {
        inProgress: false, startTime: null, frozenCameraPosition: null,
    } as EliminationState,
    gameOver: false,
    pendingMenuTitle: null as string | null,
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
    const normalizeMovementKey = (rawKey: string): keyof typeof movementState | null => {
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

    document.addEventListener("keydown", (event: KeyboardEvent) => {
        if (!gameState.active) return;
        const key = event.key.toLowerCase();
        if (!isMovementKey(key)) return;

        const normalizedKey = normalizeMovementKey(key);
        if (!normalizedKey) return;

        if (!movementState[normalizedKey]) {
            movementState[normalizedKey] = true;
            sendInputState();
        }
    });

    document.addEventListener("keyup", (event: KeyboardEvent) => {
        if (!gameState.active) return;
        const key = event.key.toLowerCase();
        if (!isMovementKey(key)) return;

        const normalizedKey = normalizeMovementKey(key);
        if (!normalizedKey) return;

        if (movementState[normalizedKey]) {
            movementState[normalizedKey] = false;
            sendInputState();
        }
    });
};

const resizeCanvas = (): void => {
    const pixelRatio = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = Math.floor(width * pixelRatio);
    canvas.height = Math.floor(height * pixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
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

    return {
        x: localPlayer.getX(), y: localPlayer.getY(),
    };
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
    startRenderLoop(playerRegistry, dotRegistry, localPlayer, context, canvas, getCameraPosition, getLocalPlayerAlpha,);
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

const handleElimination = (): void => {
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

const handleGameOver = (result: "win" | "loss"): void => {
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
setGameOverHandler(handleGameOver);
window.addEventListener("resize", resizeCanvas);

startButton?.addEventListener("click", startGame);
