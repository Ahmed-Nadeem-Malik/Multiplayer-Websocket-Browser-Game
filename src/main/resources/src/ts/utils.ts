import {Dots, MovementState, Player, Players} from "./game.js";
import {
    GRID_COLOR,
    GRID_LINE_WIDTH,
    GRID_SIZE,
    WORLD_BORDER_COLOR,
    WORLD_BORDER_WIDTH,
    WORLD_CENTER,
    WORLD_RADIUS,
} from "./constants.js";

export type CameraPosition = {
    x: number;
    y: number;
};

type CameraState = {
    cameraX: number;
    cameraY: number;
    worldViewportWidth: number;
    worldViewportHeight: number;
    currentZoom: number;
};

export function isMovementKey(key: string): key is keyof MovementState {
    return (
        key === "w" ||
        key === "a" ||
        key === "s" ||
        key === "d" ||
        key === "arrowup" ||
        key === "arrowleft" ||
        key === "arrowdown" ||
        key === "arrowright"
    );
}

export function startRenderLoop(
    playerRegistry: Players,
    dotRegistry: Dots,
    localPlayer: Player,
    renderContext: CanvasRenderingContext2D,
    gameCanvas: HTMLCanvasElement,
    getCameraPosition: () => CameraPosition,
    getLocalPlayerAlpha: () => number,
): void {
    const baseRadius = 40;
    const minZoom = 0.4;
    const maxZoom = 1;
    let currentZoom = 1;

    const loop = (): void => {
        renderContext.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

        const cameraState = getCameraState(
            gameCanvas,
            localPlayer,
            getCameraPosition,
            baseRadius,
            minZoom,
            maxZoom,
            currentZoom,
        );
        currentZoom = cameraState.currentZoom;

        renderContext.save();
        renderContext.scale(cameraState.currentZoom, cameraState.currentZoom);
        renderContext.translate(-cameraState.cameraX, -cameraState.cameraY);

        drawGrid(
            renderContext,
            cameraState.cameraX,
            cameraState.cameraY,
            cameraState.worldViewportWidth,
            cameraState.worldViewportHeight,
        );
        drawWorldBorder(renderContext);
        drawDots(dotRegistry);
        drawPlayers(playerRegistry, localPlayer, getLocalPlayerAlpha());

        renderContext.restore();
        requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function getCameraState(
    gameCanvas: HTMLCanvasElement,
    localPlayer: Player,
    getCameraPosition: () => CameraPosition,
    baseRadius: number,
    minZoom: number,
    maxZoom: number,
    currentZoom: number,
): CameraState {
    const cameraTarget = getCameraPosition();
    const viewportWidth = gameCanvas.clientWidth || gameCanvas.width;
    const viewportHeight = gameCanvas.clientHeight || gameCanvas.height;
    const localRadius = Math.max(1, localPlayer.getRadius());
    const rawZoom = baseRadius / Math.max(localRadius, baseRadius);
    const targetZoom = clamp(Math.sqrt(rawZoom), minZoom, maxZoom);
    const nextZoom = currentZoom + (targetZoom - currentZoom) * 0.08;
    const worldViewportWidth = viewportWidth / nextZoom;
    const worldViewportHeight = viewportHeight / nextZoom;
    const cameraX = cameraTarget.x - worldViewportWidth / 2;
    const cameraY = cameraTarget.y - worldViewportHeight / 2;

    return {
        cameraX,
        cameraY,
        worldViewportWidth,
        worldViewportHeight,
        currentZoom: nextZoom,
    };
}

function drawPlayers(playerRegistry: Players, localPlayer: Player, localPlayerAlpha: number): void {
    const localId = localPlayer.getId();

    for (const [playerId, currentPlayer] of Object.entries(playerRegistry.getAll())) {
        if (localId && playerId === localId) {
            continue;
        }
        currentPlayer.draw();
    }

    if (localPlayerAlpha > 0) {
        localPlayer.draw(localPlayerAlpha);
    }
}

function drawDots(dotRegistry: Dots): void {
    for (const dot of Object.values(dotRegistry.getAll())) {
        dot.draw();
    }
}

function drawWorldBorder(renderContext: CanvasRenderingContext2D): void {
    renderContext.beginPath();
    renderContext.arc(WORLD_CENTER, WORLD_CENTER, WORLD_RADIUS, 0, Math.PI * 2);
    renderContext.strokeStyle = WORLD_BORDER_COLOR;
    renderContext.lineWidth = WORLD_BORDER_WIDTH;
    renderContext.stroke();
}

function drawGrid(
    renderContext: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    viewportWidth: number,
    viewportHeight: number,
): void {
    const startX = Math.floor(cameraX / GRID_SIZE) * GRID_SIZE;
    const startY = Math.floor(cameraY / GRID_SIZE) * GRID_SIZE;
    const endX = cameraX + viewportWidth;
    const endY = cameraY + viewportHeight;

    renderContext.beginPath();
    renderContext.strokeStyle = GRID_COLOR;
    renderContext.lineWidth = GRID_LINE_WIDTH;

    for (let x = startX; x <= endX; x += GRID_SIZE) {
        renderContext.moveTo(x, cameraY);
        renderContext.lineTo(x, endY);
    }

    for (let y = startY; y <= endY; y += GRID_SIZE) {
        renderContext.moveTo(cameraX, y);
        renderContext.lineTo(endX, y);
    }

    renderContext.stroke();
}
