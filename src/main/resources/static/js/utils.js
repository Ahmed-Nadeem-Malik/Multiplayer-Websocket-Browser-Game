import { GRID_COLOR, GRID_LINE_WIDTH, GRID_SIZE, WORLD_BORDER_COLOR, WORLD_BORDER_WIDTH, WORLD_CENTER, WORLD_RADIUS, } from "./constants.js";
export function isMovementKey(key) {
    return (key === "w" ||
        key === "a" ||
        key === "s" ||
        key === "d" ||
        key === "arrowup" ||
        key === "arrowleft" ||
        key === "arrowdown" ||
        key === "arrowright");
}
export function startRenderLoop(playerRegistry, dotRegistry, localPlayer, renderContext, gameCanvas, getCameraPosition, getLocalPlayerAlpha) {
    const baseRadius = 40;
    const minZoom = 0.4;
    const maxZoom = 1;
    let currentZoom = 1;
    const loop = () => {
        renderContext.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
        const cameraTarget = getCameraPosition();
        const viewportWidth = gameCanvas.clientWidth || gameCanvas.width;
        const viewportHeight = gameCanvas.clientHeight || gameCanvas.height;
        const localRadius = Math.max(1, localPlayer.getRadius());
        const rawZoom = baseRadius / Math.max(localRadius, baseRadius);
        const targetZoom = clamp(Math.sqrt(rawZoom), minZoom, maxZoom);
        currentZoom += (targetZoom - currentZoom) * 0.08;
        const worldViewportWidth = viewportWidth / currentZoom;
        const worldViewportHeight = viewportHeight / currentZoom;
        const cameraX = cameraTarget.x - worldViewportWidth / 2;
        const cameraY = cameraTarget.y - worldViewportHeight / 2;
        renderContext.save();
        renderContext.scale(currentZoom, currentZoom);
        renderContext.translate(-cameraX, -cameraY);
        drawGrid(renderContext, cameraX, cameraY, worldViewportWidth, worldViewportHeight);
        drawWorldBorder(renderContext);
        drawDots(dotRegistry);
        drawPlayers(playerRegistry, localPlayer, getLocalPlayerAlpha());
        renderContext.restore();
        requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
}
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
function drawPlayers(playerRegistry, localPlayer, localPlayerAlpha) {
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
function drawDots(dotRegistry) {
    for (const dot of Object.values(dotRegistry.getAll())) {
        dot.draw();
    }
}
function drawWorldBorder(renderContext) {
    renderContext.beginPath();
    renderContext.arc(WORLD_CENTER, WORLD_CENTER, WORLD_RADIUS, 0, Math.PI * 2);
    renderContext.strokeStyle = WORLD_BORDER_COLOR;
    renderContext.lineWidth = WORLD_BORDER_WIDTH;
    renderContext.stroke();
}
function drawGrid(renderContext, cameraX, cameraY, viewportWidth, viewportHeight) {
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
