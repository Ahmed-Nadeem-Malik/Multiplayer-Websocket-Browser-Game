import {DOT_OPACITY, DOT_RADIUS, PLAYER_OPACITY} from "./constants.js";

export type MovementState = {
    w: boolean;
    a: boolean;
    s: boolean;
    d: boolean;
};

export type PlayerSnapshot = {
    id: string;
    name: string;
    x: number;
    y: number;
    speed: number;
    radius: number;
    colour: string;
};

export type DotSnapshot = {
    id: number;
    x: number;
    y: number;
    radius: number;
    colour: string;
};

export const movementState: MovementState = {
    w: false,
    a: false,
    s: false,
    d: false,
};

export const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;

export const context = canvas.getContext("2d")!;

export class Player {
    private id: string | undefined;
    private name: string = "undefined";
    private x: number = 500;
    private y: number = 500;
    private radius: number = 0;
    private colour: string = "#1F51FF";

    public applySnapshot(snapshot: PlayerSnapshot): void {
        Object.assign(this, snapshot);
    }

    public getId(): string | undefined {
        return this.id;
    }

    public getX(): number {
        return this.x;
    }

    public getY(): number {
        return this.y;
    }

    public draw(alphaMultiplier: number = 1): void {
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
    private playersById: Record<string, Player> = {};

    public getAll(): Record<string, Player> {
        return this.playersById;
    }

    public applySnapshot(snapshot: Record<string, PlayerSnapshot>): void {
        const nextPlayers: Record<string, Player> = {};

        for (const [id, playerSnapshot] of Object.entries(snapshot)) {
            const player = new Player();
            player.applySnapshot(playerSnapshot);
            nextPlayers[id] = player;
        }

        this.playersById = nextPlayers;
    }
}

export class Dot {
    private id: number = 0;
    private x: number = 0;
    private y: number = 0;
    private radius: number = 0;
    private colour: string = "#FFFFFF";

    public applySnapshot(snapshot: DotSnapshot): void {
        Object.assign(this, snapshot);
    }

    public getId(): number {
        return this.id;
    }

    public getX(): number {
        return this.x;
    }

    public getY(): number {
        return this.y;
    }

    public getColour(): string {
        return this.colour;
    }

    public draw(): void {
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
    private dotsById: Record<number, Dot> = {};

    public getAll(): Record<number, Dot> {
        return this.dotsById;
    }

    public applySnapshot(snapshot: DotSnapshot[]): void {
        const nextDots: Record<number, Dot> = {};

        for (const dotSnapshot of snapshot) {
            const dot = new Dot();
            dot.applySnapshot(dotSnapshot);
            nextDots[dotSnapshot.id] = dot;
        }

        this.dotsById = nextDots;
    }

    public applyUpdates(snapshot: DotSnapshot[]): void {
        for (const dotSnapshot of snapshot) {
            const existing = this.dotsById[dotSnapshot.id] ?? new Dot();
            existing.applySnapshot(dotSnapshot);
            this.dotsById[dotSnapshot.id] = existing;
        }
    }
}
