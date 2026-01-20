export const movementState = { w: false, a: false, s: false, d: false };
export const canvas = document.getElementById("gameCanvas");
export const context = canvas.getContext("2d");
export class Player {
    constructor() {
        this.x = 500;
        this.y = 500;
        this.radius = 20;
        this.speed = 5;
        this.colour = "#1F51FF";
    }
    applySnapshot(snapshot) {
        Object.assign(this, snapshot);
    }
    setId(id) {
        this.id = id;
    }
    getId() {
        return this.id;
    }
    update(movement) {
        if (movement.w)
            this.y -= this.speed;
        if (movement.s)
            this.y += this.speed;
        if (movement.a)
            this.x -= this.speed;
        if (movement.d)
            this.x += this.speed;
    }
    getX() {
        return this.x;
    }
    getY() {
        return this.y;
    }
    draw() {
        context.save();
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        context.fillStyle = this.colour;
        context.globalAlpha = 0.85;
        context.fill();
        context.restore();
    }
}
export class Players {
    constructor() {
        this.playersById = {};
    }
    getAll() {
        return this.playersById;
    }
    applySnapshot(snapshot) {
        const nextPlayers = {};
        for (const [id, playerSnapshot] of Object.entries(snapshot)) {
            const player = new Player();
            player.applySnapshot(playerSnapshot);
            nextPlayers[id] = player;
        }
        this.playersById = nextPlayers;
    }
}
