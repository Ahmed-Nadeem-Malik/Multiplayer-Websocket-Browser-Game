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

export type CameraPosition = { x: number; y: number };

export function isMovementKey(key: string): key is keyof MovementState {
    return key === "w" || key === "a" || key === "s" || key === "d";
}

export function startRenderLoop(playerRegistry: Players, dotRegistry: Dots, localPlayer: Player, renderContext: CanvasRenderingContext2D, gameCanvas: HTMLCanvasElement, getCameraPosition: () => CameraPosition, getLocalPlayerAlpha: () => number,): void {
    const loop = (): void => {
        renderContext.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

        const cameraTarget = getCameraPosition();
        const cameraX = cameraTarget.x - gameCanvas.width / 2;
        const cameraY = cameraTarget.y - gameCanvas.height / 2;

        renderContext.save();
        renderContext.translate(-cameraX, -cameraY);

        drawGrid(renderContext, cameraX, cameraY, gameCanvas.width, gameCanvas.height);
        drawWorldBorder(renderContext);
        drawDots(dotRegistry);
        drawPlayers(playerRegistry, localPlayer, getLocalPlayerAlpha());

        renderContext.restore();
        requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
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

function drawGrid(renderContext: CanvasRenderingContext2D, cameraX: number, cameraY: number, viewportWidth: number, viewportHeight: number,): void {
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
