export function isMovementKey(key) {
    return key === "w" || key === "a" || key === "s" || key === "d";
}
const WORLD_RADIUS = 3000;
const WORLD_CENTER = WORLD_RADIUS;
const GRID_SIZE = 100;
export function startRenderLoop(playerRegistry, localPlayer, renderContext, gameCanvas) {
    const loop = () => {
        renderContext.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
        const cameraX = localPlayer.getX() - gameCanvas.width / 2;
        const cameraY = localPlayer.getY() - gameCanvas.height / 2;
        renderContext.save();
        renderContext.translate(-cameraX, -cameraY);
        drawGrid(renderContext, cameraX, cameraY, gameCanvas.width, gameCanvas.height);
        renderContext.beginPath();
        renderContext.arc(WORLD_CENTER, WORLD_CENTER, WORLD_RADIUS, 0, Math.PI * 2);
        renderContext.strokeStyle = "rgba(0, 0, 0, 0.25)";
        renderContext.lineWidth = 6;
        renderContext.stroke();
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
function drawGrid(renderContext, cameraX, cameraY, viewportWidth, viewportHeight) {
    const startX = Math.floor(cameraX / GRID_SIZE) * GRID_SIZE;
    const startY = Math.floor(cameraY / GRID_SIZE) * GRID_SIZE;
    const endX = cameraX + viewportWidth;
    const endY = cameraY + viewportHeight;
    renderContext.beginPath();
    renderContext.strokeStyle = "rgba(0, 0, 0, 0.08)";
    renderContext.lineWidth = 1;
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
