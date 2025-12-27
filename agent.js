/**
 * Agent Module
 * Cube-shaped agent with physics, 360° raycasting sensors, and neural control
 */

class Agent {
    constructor(x, y, maze, brain = null) {
        // Position and physics
        this.x = x;
        this.y = y;
        this.startX = x;
        this.startY = y;
        this.angle = 0; // Facing right initially
        this.speed = 0;
        this.angularVelocity = 0;

        // Physical properties
        this.size = CONFIG.physics.size;
        this.maxSpeed = CONFIG.physics.maxSpeed;
        this.acceleration = CONFIG.physics.acceleration;
        this.friction = CONFIG.physics.friction;
        this.rotationSpeed = CONFIG.physics.rotationSpeed;
        this.angularFriction = CONFIG.physics.angularFriction;
        this.rayCount = CONFIG.sensors.rayCount;
        this.rayLength = CONFIG.sensors.rayLength;
        this.raySpread = Math.PI;
        this.rays = [];
        this.readings = [];
        this.wallHits = 0;
        this.invincibleFrames = 60; // Grace period at start
        this.wallSlideTime = 0;
        this.wallSlideDistance = 0;

        // State
        this.alive = true;
        this.reachedGoal = false;
        this.age = 0;
        this.stationaryTime = 0;
        this.maxDistanceFromStart = 0;
        this.closestToGoal = Infinity;
        this.totalRotation = 0;
        this.lastAngle = this.angle;

        this.initialDistToGoal = maze.getDistanceToGoal(x, y);
        this.closestToGoal = this.initialDistToGoal;
        this.progressMade = 0;

        this.totalForwardMovement = 0;
        this.lastX = x;
        this.lastY = y;

        // Reference to maze
        this.maze = maze;

        // Neural network
        // Inputs: rayCount + speed + compass angle
        const inputCount = this.rayCount + 4;
        if (brain) {
            this.brain = NeuralNetwork.clone(brain);
        } else {
            // With 16 rays + 4 other inputs = 20 inputs
            this.brain = new NeuralNetwork([inputCount, 16, 12, 4]);
        }

        // Initialize sensors
        this.checkpoints = new Set();
        this.#castRays();
    }

    update() {
        if (!this.alive) return;

        this.age++;

        // Get sensor readings
        this.#castRays();

        // Prepare neural network inputs
        const inputs = this.#getInputs();

        // Get outputs from brain
        const outputs = NeuralNetwork.feedForward(inputs, this.brain);

        // Apply outputs to controls
        const forward = outputs[0];
        const backward = outputs[1];
        const rotateLeft = outputs[2];
        const rotateRight = outputs[3];

        // Apply rotation
        this.angularVelocity += (rotateRight - rotateLeft) * this.rotationSpeed;
        this.angularVelocity *= this.angularFriction;
        this.angle += this.angularVelocity;

        let deltaAngle = this.angle - this.lastAngle;
        while (deltaAngle > Math.PI) deltaAngle -= 2 * Math.PI;
        while (deltaAngle < -Math.PI) deltaAngle += 2 * Math.PI;
        this.totalRotation += Math.abs(deltaAngle);
        this.lastAngle = this.angle;

        // Apply thrust
        const thrust = (forward - backward) * this.acceleration;
        this.speed += thrust;
        this.speed *= this.friction;
        this.speed = Math.max(-this.maxSpeed * 0.5, Math.min(this.maxSpeed, this.speed));

        // Update position with wall sliding
        const prevX = this.x;
        const prevY = this.y;
        let dx = Math.cos(this.angle) * this.speed;
        let dy = Math.sin(this.angle) * this.speed;

        this.x += dx;
        this.y += dy;

        // Wall sliding
        const collision = this.#checkCollision();
        if (collision) {
            const wall = collision.wall;

            // Wall direction vector (normalized)
            const wallDx = wall.x2 - wall.x1;
            const wallDy = wall.y2 - wall.y1;
            const wallLen = Math.sqrt(wallDx * wallDx + wallDy * wallDy);
            const wallNormX = wallDx / wallLen;
            const wallNormY = wallDy / wallLen;

            // Project velocity onto wall direction (dot product)
            const dot = dx * wallNormX + dy * wallNormY;
            const slideDx = wallNormX * dot * 0.7;
            const slideDy = wallNormY * dot * 0.7;

            // Push away from wall
            const pushDist = (this.size / 2) - collision.dist + 1;
            const perpX = -(wallDy / wallLen);
            const perpY = (wallDx / wallLen);

            // Determine which side to push toward
            const toCenterX = prevX - this.x;
            const toCenterY = prevY - this.y;
            const pushSign = (toCenterX * perpX + toCenterY * perpY) > 0 ? 1 : -1;

            // Apply slide + push
            this.x = prevX + slideDx + perpX * pushDist * pushSign;
            this.y = prevY + slideDy + perpY * pushDist * pushSign;

            // Track wall contact
            this.wallSlideTime++;
            this.wallSlideDistance += Math.sqrt(slideDx * slideDx + slideDy * slideDy);

            // Reduce speed while sliding
            this.speed *= 0.85;
        }

        // Kill if wall-hugging too much
        if (this.age > 200 && this.wallSlideTime > this.age * 0.5) {
            this.alive = false;
        }

        // Track forward movement
        const moveDx = this.x - this.lastX;
        const moveDy = this.y - this.lastY;
        const movementDir = Math.atan2(moveDy, moveDx);
        const angleDiff = Math.abs(movementDir - this.angle);
        const forwardComponent = Math.cos(angleDiff) * Math.sqrt(moveDx * moveDx + moveDy * moveDy);
        if (forwardComponent > 0) {
            this.totalForwardMovement += forwardComponent;
        }
        this.lastX = this.x;
        this.lastY = this.y;

        // Check for stationary behavior
        const moved = Math.abs(this.x - prevX) + Math.abs(this.y - prevY);
        if (moved < CONFIG.culling.stationaryThreshold) {
            this.stationaryTime++;
        } else {
            this.stationaryTime = Math.max(0, this.stationaryTime - 1);
        }

        // Kill if stationary too long
        if (this.stationaryTime > CONFIG.culling.stationaryDeathTime) {
            this.alive = false;
        }

        // Kill non-starters at early death frame
        if (this.age === CONFIG.culling.earlyDeathFrame) {
            const distFromStart = Math.sqrt((this.x - this.startX) ** 2 + (this.y - this.startY) ** 2);
            if (distFromStart < this.maze.cellSize * CONFIG.culling.earlyDeathMinDistance) {
                this.alive = false;
            }
        }

        // Track progress
        const distFromStart = this.#getDistanceFromStart();
        this.maxDistanceFromStart = Math.max(this.maxDistanceFromStart, distFromStart);

        // Check goal
        if (this.maze.isAtGoal(this.x, this.y, this.size)) {
            this.reachedGoal = true;
            this.alive = false;
        }

        // Update closest to goal
        const currentDist = this.maze.getDistanceToGoal(this.x, this.y);
        if (currentDist < this.closestToGoal) {
            this.progressMade += (this.closestToGoal - currentDist);
            this.closestToGoal = currentDist;
        }

        this.#recordCheckpoint();
    }

    #getInputs() {
        const inputs = [];

        // Ray readings (normalized 0-1, 0 = wall close, 1 = no wall)
        for (const reading of this.readings) {
            inputs.push(reading === null ? 1 : 1 - reading);
        }

        // Speed (normalized)
        inputs.push(this.speed / this.maxSpeed);

        // Compass to goal (normalized -1 to 1)
        const compass = this.maze.getAngleToGoal(this.x, this.y, this.angle);
        inputs.push(compass);

        // NEW: Normalized distance to goal (0 = at goal, 1 = far away)
        const distToGoal = this.maze.getDistanceToGoal(this.x, this.y);
        const maxDist = Math.sqrt(this.maze.width ** 2 + this.maze.height ** 2);
        inputs.push(distToGoal / maxDist);

        // NEW: Angular velocity (helps network learn smooth turning)
        inputs.push(this.angularVelocity / this.rotationSpeed);

        return inputs;
    }

    #castRays() {
        this.rays = [];
        this.readings = [];

        for (let i = 0; i < this.rayCount; i++) {
            const rayAngle = this.angle +
                (i / this.rayCount) * this.raySpread -
                this.raySpread / 2;

            const ray = {
                x: this.x,
                y: this.y,
                dx: Math.cos(rayAngle),
                dy: Math.sin(rayAngle),
                length: this.rayLength,
                angle: rayAngle
            };

            this.rays.push(ray);
            this.readings.push(this.#getRayReading(ray));
        }
    }

    #getRayReading(ray) {
        let closest = null;
        let minOffset = Infinity;

        for (const wall of this.maze.walls) {
            const intersection = this.maze.getIntersection(ray, wall);
            if (intersection && intersection.offset < minOffset) {
                minOffset = intersection.offset;
                closest = intersection;
            }
        }

        return closest ? minOffset : null;
    }

    #checkCollision() {
        const halfSize = this.size / 2;
        let closestWall = null;
        let closestDist = Infinity;

        for (const wall of this.maze.walls) {
            const dist = this.#pointToLineDistance(
                this.x, this.y,
                wall.x1, wall.y1,
                wall.x2, wall.y2
            );
            if (dist < halfSize && dist < closestDist) {
                closestDist = dist;
                closestWall = wall;
            }
        }

        return closestWall ? { wall: closestWall, dist: closestDist } : null;
    }

    #pointToLineDistance(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;

        if (lenSq !== 0) param = dot / lenSq;

        let xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }

    #getDistanceFromStart() {
        const dx = this.x - this.startX;
        const dy = this.y - this.startY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    getFitness() {
        if (this.reachedGoal) {
            return CONFIG.fitness.goalBaseReward + (CONFIG.fitness.goalSpeedBonus / this.age);
        }

        const distFromStart = this.#getDistanceFromStart();
        let fitness = 0;

        fitness += this.checkpoints.size * CONFIG.fitness.checkpointReward;

        const progressPercent = this.progressMade / this.initialDistToGoal;
        fitness += progressPercent * CONFIG.fitness.progressMultiplier;

        // NEW: Reward efficient forward movement (not just survival)
        const movementEfficiency = this.totalForwardMovement / Math.max(1, this.age);
        fitness += movementEfficiency * 50;

        if (distFromStart > this.maze.cellSize * 2) {
            fitness += this.age * CONFIG.fitness.survivalReward;
        }

        // Wall sliding penalty - discourage hugging walls
        if (this.wallSlideTime > 0) {
            const slideRatio = this.wallSlideTime / this.age;
            // Heavy penalty if spending >30% of time on walls
            if (slideRatio > 0.3) {
                fitness *= Math.pow(0.5, slideRatio);
            }
            // Additional penalty based on slide distance vs progress
            if (this.wallSlideDistance > this.progressMade * 0.5) {
                fitness *= 0.7;
            }
        }
        // Spinner penalty
        if (distFromStart > 1) {
            const spinRatio = this.totalRotation / distFromStart;
            if (spinRatio > CONFIG.penalties.spinRatioThreshold) {
                const penalty = Math.pow(CONFIG.penalties.spinPenaltyFactor, spinRatio);
                fitness *= penalty;
            }
        } else if (this.age > CONFIG.penalties.nonMoverAgeCutoff) {
            fitness *= CONFIG.penalties.nonMoverPenalty;
        }

        if (distFromStart < this.maze.cellSize && this.age > 150) {
            fitness *= 0.01;
        }

        return Math.max(CONFIG.fitness.minFitness, fitness);
    }

    draw(ctx, showSensors = false, isAllTimeBest = false) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Draw sensors if enabled
        if (showSensors && this.alive) {
            this.#drawSensors(ctx);
        }

        // Draw body (circle)
        const radius = this.size / 2;

        if (this.reachedGoal) {
            ctx.fillStyle = '#0f0';
            ctx.strokeStyle = '#080';
        } else if (!this.alive) {
            ctx.fillStyle = '#888';
            ctx.strokeStyle = '#444';
        } else if (isAllTimeBest) {
            // All-time best: red/orange highlight
            ctx.fillStyle = '#ff4444';
            ctx.strokeStyle = '#cc0000';
        } else {
            ctx.fillStyle = '#4af';
            ctx.strokeStyle = '#28c';
        }
        if (this.alive) {

            ctx.lineWidth = isAllTimeBest ? 3 : 2;
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Direction arrow
            ctx.fillStyle = this.alive ? '#fff' : '#aaa';
            ctx.beginPath();
            ctx.moveTo(radius + 2, 0);           // Arrow tip
            ctx.lineTo(radius - 4, -4);          // Top corner
            ctx.lineTo(radius - 4, 4);           // Bottom corner
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
    }

    #recordCheckpoint() {
        const cellX = Math.floor(this.x / this.maze.cellSize);
        const cellY = Math.floor(this.y / this.maze.cellSize);
        this.checkpoints.add(`${cellX},${cellY}`);
    }

    #drawSensors(ctx) {
        for (let i = 0; i < this.rays.length; i++) {
            const ray = this.rays[i];
            const reading = this.readings[i];

            // Calculate ray end in local coordinates
            const localAngle = ray.angle - this.angle;
            const length = reading !== null ? reading * this.rayLength : this.rayLength;
            const endX = Math.cos(localAngle) * length;
            const endY = Math.sin(localAngle) * length;

            // Color based on proximity
            if (reading !== null) {
                const r = Math.floor(255 * (1 - reading));
                const g = Math.floor(255 * reading);
                ctx.strokeStyle = `rgba(${r}, ${g}, 0, 0.5)`;
            } else {
                ctx.strokeStyle = 'rgba(0, 255, 0, 0.2)';
            }

            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(endX, endY);
            ctx.stroke();

            // Draw intersection point
            if (reading !== null) {
                ctx.fillStyle = '#f00';
                ctx.beginPath();
                ctx.arc(endX, endY, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
}
