/**
 * Represents the current input state for movement keys.
 */
export type InputState = {
    w: boolean;
    a: boolean;
    s: boolean;
    d: boolean;
};

/**
 * Shared input state used by the game loop.
 */
export const inputState: InputState = {w: false, a: false, s: false, d: false};

/**
 * Main game canvas element.
 */
export const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;

/**
 * 2D rendering context for the game canvas.
 */
export const ctx = canvas.getContext("2d")!;

/**
 * Player entity rendered and updated by the game loop.
 */
export class Player {
    private id: String | undefined
    private x = 500;
    private y = 500;
    private radius = 20;
    private speed = 5;

    /**
     * Assigns the server-provided player ID.
     */
    public setId(id: String): void {
        this.id = id;
    }

    /**
     * Updates player position based on input.
     */
    public update(input: InputState): void {
        if (input.w) this.y -= this.speed;
        if (input.s) this.y += this.speed;
        if (input.a) this.x -= this.speed;
        if (input.d) this.x += this.speed;
    }

    /**
     * Draws the player on the canvas.
     */
    public draw(): void {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
    }
}
