class Sensor {
    constructor(agent) {
        this.agent = agent;
        this.rayCount = 12; // 360 degrees coverage
        this.rayLength = 150;
        this.raySpread = Math.PI * 2;

        this.rays = [];
        this.readings = [];
    }

    update(roadBorders) {
        this.#castRays();
        this.readings = [];
        for (let i = 0; i < this.rays.length; i++) {
            this.readings.push(
                this.#getReading(this.rays[i], roadBorders)
            );
        }
    }

    #getReading(ray, roadBorders) {
        let touches = [];
        for (let i = 0; i < roadBorders.length; i++) {
            const touch = getIntersection(
                ray[0], ray[1],
                roadBorders[i][0], roadBorders[i][1]
            );
            if (touch) touches.push(touch);
        }

        if (touches.length == 0) return null;

        const offsets = touches.map(e => e.offset);
        const minOffset = Math.min(...offsets);
        return touches.find(e => e.offset == minOffset);
    }

    #castRays() {
        this.rays = [];
        for (let i = 0; i < this.rayCount; i++) {
            const rayAngle = lerp(
                this.agent.angle - this.raySpread / 2,
                this.agent.angle + this.raySpread / 2,
                this.rayCount == 1 ? 0.5 : i / (this.rayCount - 1)
            ) + this.agent.angle; // Make it relative to agent rotation? 
            // Note: Adding agent.angle makes the sensors rotate WITH the agent.

            const start = { x: this.agent.x, y: this.agent.y };
            const end = {
                x: this.agent.x - Math.sin(rayAngle) * this.rayLength,
                y: this.agent.y - Math.cos(rayAngle) * this.rayLength
            };
            this.rays.push([start, end]);
        }
    }

    draw(ctx) {
        for (let i = 0; i < this.rayCount; i++) {
            let end = this.rays[i][1];
            if (this.readings[i]) end = this.readings[i];

            ctx.beginPath();
            ctx.lineWidth = 2;
            ctx.strokeStyle = "rgba(255,255,0,0.3)";
            ctx.moveTo(this.rays[i][0].x, this.rays[i][0].y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();

            ctx.beginPath();
            ctx.lineWidth = 2;
            ctx.strokeStyle = "rgba(0,0,0,0.5)";
            ctx.moveTo(this.rays[i][1].x, this.rays[i][1].y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
        }
    }
}