import { ctx } from "./rendering.js";
export class Player {
    constructor() {
        this.x = 500;
        this.y = 500;
        this.radius = 20;
        this.speed = 5;
    }
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
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
    }
}
