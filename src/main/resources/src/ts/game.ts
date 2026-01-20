import {PLAYER_OPACITY, PLAYER_RADIUS} from "./constants.js";

/**
 * Represents the current input state for movement keys.
 */
export type MovementState = {
    w: boolean; a: boolean; s: boolean; d: boolean;
};

/**
 * Serializable data shape for player state.
 */
export type PlayerSnapshot = {
    id: string; x: number; y: number; speed: number; colour: string;
};

export const movementState: MovementState = {w: false, a: false, s: false, d: false};

export const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;

export const context = canvas.getContext("2d")!;

export class Player {
    private id: string | undefined
    private x: number = 500;
    private y: number = 500;
    private radius: number = PLAYER_RADIUS;
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

    public draw(): void {
        context.save();
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        context.fillStyle = this.colour;
        context.globalAlpha = PLAYER_OPACITY;
        context.fill();
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
