import { DOT_OPACITY, DOT_RADIUS, PLAYER_OPACITY } from "./constants.js";
export const movementState = {
    w: false, a: false, s: false, d: false,
};
export const canvas = document.getElementById("gameCanvas");
export const context = canvas.getContext("2d");
export class Player {
    constructor() {
        this.name = "undefined";
        this.x = 500;
        this.y = 500;
        this.radius = 0;
        this.colour = "#1F51FF";
    }
    applySnapshot(snapshot) {
        Object.assign(this, snapshot);
    }
    getId() {
        return this.id;
    }
    getX() {
        return this.x;
    }
    getY() {
        return this.y;
    }
    draw(alphaMultiplier = 1) {
        const clampedAlpha = Math.max(0, Math.min(1, alphaMultiplier));
        context.save();
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        context.fillStyle = this.colour;
        context.globalAlpha = PLAYER_OPACITY * clampedAlpha;
        context.fill();
        context.globalAlpha = clampedAlpha;
        if (this.name) {
            const maxDiameter = this.radius * 1.6;
            const baseFontSize = Math.max(12, Math.floor(this.radius / 2));
            let fontSize = baseFontSize;
            context.font = `${fontSize}px sans-serif`;
            let textWidth = context.measureText(this.name).width;
            if (textWidth > maxDiameter && textWidth > 0) {
                const scale = Math.max(0.5, maxDiameter / textWidth);
                fontSize = Math.floor(baseFontSize * scale);
                context.font = `${fontSize}px sans-serif`;
            }
            context.fillStyle = "#000000";
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.fillText(this.name, this.x, this.y);
        }
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
export class Dot {
    constructor() {
        this.id = 0;
        this.x = 0;
        this.y = 0;
        this.radius = 0;
        this.colour = "#FFFFFF";
    }
    applySnapshot(snapshot) {
        Object.assign(this, snapshot);
    }
    getId() {
        return this.id;
    }
    getX() {
        return this.x;
    }
    getY() {
        return this.y;
    }
    getColour() {
        return this.colour;
    }
    draw() {
        context.save();
        context.beginPath();
        context.arc(this.x, this.y, this.radius || DOT_RADIUS, 0, Math.PI * 2);
        context.fillStyle = this.colour;
        context.globalAlpha = DOT_OPACITY;
        context.fill();
        context.restore();
    }
}
export class Dots {
    constructor() {
        this.dotsById = {};
    }
    getAll() {
        return this.dotsById;
    }
    applySnapshot(snapshot) {
        const nextDots = {};
        for (const dotSnapshot of snapshot) {
            const dot = new Dot();
            dot.applySnapshot(dotSnapshot);
            nextDots[dotSnapshot.id] = dot;
        }
        this.dotsById = nextDots;
    }
    applyUpdates(snapshot) {
        for (const dotSnapshot of snapshot) {
            const existing = this.dotsById[dotSnapshot.id] ?? new Dot();
            existing.applySnapshot(dotSnapshot);
            this.dotsById[dotSnapshot.id] = existing;
        }
    }
}
