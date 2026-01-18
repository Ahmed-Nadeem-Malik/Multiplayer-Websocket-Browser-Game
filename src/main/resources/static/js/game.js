/**
 * Shared input state used by the game loop.
 */
export const inputState = { w: false, a: false, s: false, d: false };
/**
 * Main game canvas element.
 */
export const canvas = document.getElementById("gameCanvas");
/**
 * 2D rendering context for the game canvas.
 */
export const ctx = canvas.getContext("2d");
/**
 * Player entity rendered and updated by the game loop.
 */
export class Player {
    constructor() {
        this.x = 500;
        this.y = 500;
        this.radius = 20;
        this.speed = 5;
    }
    hydrate(data) {
        Object.assign(this, data);
    }
    /**
     * Assigns the server-provided player ID.
     */
    setId(id) {
        this.id = id;
    }
    /**
     * Returns the current player id.
     */
    getId() {
        return this.id;
    }
    /**
     * Updates player position based on input.
     */
    update(input) {
        if (input.w)
            this.y -= this.speed;
        if (input.s)
            this.y += this.speed;
        if (input.a)
            this.x -= this.speed;
        if (input.d)
            this.x += this.speed;
    }
    /**
     * Draws the player on the canvas.
     */
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.stroke();
    }
}
export class Players {
    constructor() {
        this.hashMap = {};
    }
    getPlayers() {
        return this.hashMap;
    }
    hydrate(jsonData) {
        const next = {};
        for (const [id, dto] of Object.entries(jsonData)) {
            const player = new Player();
            player.hydrate(dto);
            next[id] = player;
        }
        this.hashMap = next;
    }
}
