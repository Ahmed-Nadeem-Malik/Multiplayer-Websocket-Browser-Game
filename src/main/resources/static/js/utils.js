/**
 * Checks whether a key is one of the movement keys.
 */
export function isMovementKey(k) {
    return k === "w" || k === "a" || k === "s" || k === "d";
}
/**
 * Starts the requestAnimationFrame loop for updates and rendering.
 */
export function startGameLoop(player, players, inputState, ctx, canvas) {
    const loop = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (const currentPlayer of Object.values(players.getPlayers())) {
            currentPlayer.draw();
        }
        requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
}
