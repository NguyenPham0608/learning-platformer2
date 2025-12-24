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
        this.timeAlive = 0;
        this.stagnationTime = 0;
        this.diedByFalling = false;
        this.jumpCount = 0;

        this.visitedLeft = startX;
        this.visitedRight = startX;
        this.totalProgress = 0;

        this.stuckTime = 0;
        this.lastMoveX = startX;

        // Track wall hugging
        this.wallHugTime = 0;
        this.againstWallRight = false;
        this.againstWallLeft = false;

        // Momentum - don't change direction instantly
        this.moveDir = 0;
    }

    think() {
        const inputs = getSensors(this);
        return this.brain.forward(inputs);
    }

    update(dt) {
        if (!this.alive) return;

        const outputs = this.think();

        // Target direction from network
        let targetDir = outputs[1] - outputs[0]; // -1 to 1

        // Smooth out direction changes (momentum)
        this.moveDir = this.moveDir * 0.8 + targetDir * 0.2;

        const jump = outputs[2] > 0.5 && this.onGround;

        const accel = 1000;
        this.velX += this.moveDir * accel * dt;
        this.velY += 980 * dt;

        if (jump) {
            this.velY = -400;
            this.onGround = false;
            this.jumpCount++;
        }

        const newX = this.x + this.velX * dt;
        const wallHit = checkWallCollision(this, newX);

        this.againstWallRight = false;
        this.againstWallLeft = false;

        if (wallHit.hit) {
            this.x = wallHit.x;
            if (this.velX > 0) this.againstWallRight = true;
            if (this.velX < 0) this.againstWallLeft = true;
            this.velX = 0;
        } else {
            this.x = newX;
        }

        this.y += this.velY * dt;
        this.velX *= 0.97;

        // Floor collision
        this.onGround = false;
        if (this.velY >= 0) {
            const cubeBottom = this.y + this.size / 2;
            const cubeTop = this.y - this.size / 2;
            const floorY = getFloorYBelow(this.x, cubeTop);

            if (floorY !== Infinity && cubeBottom >= floorY) {
                this.y = floorY - this.size / 2;
                this.velY = 0;
                this.onGround = true;
            }
        }

        // Ceiling collision
        if (this.velY < 0) {
            const cubeTop = this.y - this.size / 2;
            const cubeBottom = this.y + this.size / 2;
            const ceilingY = getCeilingY(this.x, cubeBottom);

            if (ceilingY !== -Infinity && cubeTop <= ceilingY) {
                this.y = ceilingY + this.size / 2;
                this.velY = 0;
            }
        }

        if (checkHazardCollision(this)) {
            this.alive = false;
        }

        if (this.y > deathY) {
            this.alive = false;
            this.diedByFalling = true;
        }

        // Track wall hugging
        if (this.againstWallRight || this.againstWallLeft) {
            this.wallHugTime += dt;
        } else {
            this.wallHugTime = Math.max(0, this.wallHugTime - dt * 0.5);
        }

        // Track new ground covered
        let newProgress = 0;
        if (this.x > this.visitedRight) {
            newProgress += this.x - this.visitedRight;
            this.visitedRight = this.x;
        }
        if (this.x < this.visitedLeft) {
            newProgress += this.visitedLeft - this.x;
            this.visitedLeft = this.x;
        }

        if (newProgress > 0) {
            this.totalProgress += newProgress;
            this.stagnationTime = 0;
        } else {
            this.stagnationTime += dt;
        }

        // Track if actually moving
        if (Math.abs(this.x - this.lastMoveX) < 2) {
            this.stuckTime += dt;
        } else {
            this.stuckTime = 0;
            this.lastMoveX = this.x;
        }

        this.timeAlive += dt;

        // Die faster if stuck
        if (this.stagnationTime > 3) {
            this.alive = false;
        }
        if (this.stuckTime > 2) {
            this.alive = false;
        }
    }

    getFitness() {
        let fitness = 0;

        // Reward total exploration (squared to really reward big exploration)
        fitness += Math.pow(this.totalProgress, 1.5) * 10;

        // Reward rightward progress more
        let rightProgress = this.visitedRight - startX;
        fitness += rightProgress * 50;

        // Reward exploring left too
        let leftProgress = startX - this.visitedLeft;
        fitness += leftProgress * 30;

        // Big bonus for getting close to finish
        let distToFinish = Math.max(0, finishX - this.visitedRight);
        if (distToFinish < 500) {
            fitness += (500 - distToFinish) * 100;
        }

        // Huge bonus for reaching finish
        if (this.visitedRight >= finishX) {
            fitness += 1000000 / (this.timeAlive + 1);
        }

        // HEAVY penalty for wall hugging
        fitness -= this.wallHugTime * 500;

        // Penalty for being stuck
        fitness -= this.stuckTime * 300;

        // Penalty for dying
        if (!this.alive && this.visitedRight < finishX) {
            fitness -= 500;
        }
        if (this.diedByFalling) {
            fitness -= 2000;
        }

        return Math.max(0, fitness);
    }
}