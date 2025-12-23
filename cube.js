// cube.js
class Cube {
    constructor(brain) {
        this.brain = brain;
        this.x = startX;
        this.y = startY;
        this.velX = 0;
        this.velY = 0;
        this.size = 20;
        this.onGround = true;
        this.alive = true;
        this.maxX = startX;
        this.timeAlive = 0;
        this.stagnationTime = 0;
        this.lastMaxX = startX;
        this.diedByFalling = false;
        this.jumpCount = 0;
    }

    think() {
        const inputs = getSensors(this);
        return this.brain.forward(inputs);
    }

    update(dt) {
        if (!this.alive) return;

        const outputs = this.think();
        const moveForce = outputs[1] - outputs[0]; // right - left, -1 to 1
        const jump = outputs[2] > 0.5 && this.onGround;

        const accel = 1000;
        this.velX += moveForce * accel * dt;

        this.velY += 980 * dt; // Gravity

        if (jump) {
            this.velY = -400;
            this.onGround = false;
            this.jumpCount++;
        }

        this.x += this.velX * dt;
        this.y += this.velY * dt;

        // Friction
        this.velX *= 0.95;

        // Collision with platforms
        this.onGround = false;
        if (this.velY >= 0) {
            const floorY = getFloorY(this.x);
            if (floorY !== Infinity && this.y + this.size / 2 >= floorY && this.y - this.size / 2 < floorY) {
                this.y = floorY - this.size / 2;
                this.velY = 0;
                this.onGround = true;
            }
        }

        // Check hazards
        if (checkHazardCollision(this)) {
            this.alive = false;
        }

        // Check death by fall
        if (this.y > deathY) {
            this.alive = false;
            this.diedByFalling = true;
        }

        // Update maxX
        if (this.x > this.maxX) {
            this.maxX = this.x;
            this.stagnationTime = 0;
        } else {
            this.stagnationTime += dt;
        }

        this.timeAlive += dt;

        // Stagnation penalty: die if no progress for 5 seconds
        if (this.stagnationTime > 5) {
            this.alive = false;
        }
    }

    getFitness() {
        let distance = this.maxX - startX;
        let fitness = Math.pow(distance, 1.5);
        if (this.maxX >= finishX) {
            fitness += 100000 / (this.timeAlive + 1); // Reward reaching fast
        } else {
            fitness += this.timeAlive; // Minor reward for surviving longer without reaching
            if (!this.alive) {
                fitness -= 1000; // Penalty for dying without reaching
            }
            if (this.diedByFalling) {
                fitness -= 2000; // Extra penalty for falling into the abyss
            }
        }
        fitness -= this.stagnationTime * 100; // Penalty for stagnation
        fitness -= this.jumpCount * 70; // Penalty for excessive jumps
        return fitness;
    }
}