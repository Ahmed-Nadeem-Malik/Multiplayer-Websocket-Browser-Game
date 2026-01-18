import {InputState, Player, Players} from "./game.js";

/**
 * Checks whether a key is one of the movement keys.
 */
export function isMovementKey(k: string): k is keyof InputState {
    return k === "w" || k === "a" || k === "s" || k === "d";
}

/**
 * Starts the requestAnimationFrame loop for updates and rendering.
 */
export function startGameLoop(
    player: Player,
    players: Players,
    inputState: InputState,
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement
): void {
    const loop = (): void => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (const currentPlayer of Object.values(players.getPlayers())) {
            currentPlayer.draw();
        }
        requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
}
