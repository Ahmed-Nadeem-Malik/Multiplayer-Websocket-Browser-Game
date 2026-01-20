import { GRID_COLOR, GRID_LINE_WIDTH, GRID_SIZE, WORLD_BORDER_COLOR, WORLD_BORDER_WIDTH, WORLD_CENTER, WORLD_RADIUS, } from "./constants.js";
export function isMovementKey(key) {
    return key === "w" || key === "a" || key === "s" || key === "d";
}
export function startRenderLoop(playerRegistry, localPlayer, renderContext, gameCanvas) {
    const loop = () => {
        renderContext.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
        const cameraX = localPlayer.getX() - gameCanvas.width / 2;
        const cameraY = localPlayer.getY() - gameCanvas.height / 2;
        renderContext.save();
        renderContext.translate(-cameraX, -cameraY);
        drawGrid(renderContext, cameraX, cameraY, gameCanvas.width, gameCanvas.height);
        drawWorldBorder(renderContext);
        const localId = localPlayer.getId();
        for (const [playerId, currentPlayer] of Object.entries(playerRegistry.getAll())) {
            if (localId && playerId === localId) {
                continue;
            }
            currentPlayer.draw();
        }
        localPlayer.draw();
        renderContext.restore();
        requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
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
