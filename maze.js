/**
 * Maze Generation Module
 * Uses Recursive Backtracking algorithm to generate solvable mazes
 */

class Maze {
    constructor(cols, rows, cellSize) {
        this.cols = cols;
        this.rows = rows;
        this.cellSize = cellSize;
        this.width = cols * cellSize;
        this.height = rows * cellSize;
        this.grid = [];
        this.walls = []; // For collision detection
        this.start = { x: 0, y: 0 };
        this.goal = { x: 0, y: 0 };

        this.generate();
    }

    generate() {
        // Initialize grid with all walls
        this.grid = [];
        for (let row = 0; row < this.rows; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.cols; col++) {
                this.grid[row][col] = {
                    visited: false,
                    walls: { top: true, right: true, bottom: true, left: true }
                };
            }
        }

        // Recursive backtracking
        this.#carvePassages(0, 0);

        // Set start (top-left) and goal (bottom-right)
        this.start = {
            x: this.cellSize / 2,
            y: this.cellSize / 2
        };
        this.goal = {
            x: (this.cols - 0.5) * this.cellSize,
            y: (this.rows - 0.5) * this.cellSize
        };

        // Build wall segments for collision detection
        this.#buildWalls();
    }

    #carvePassages(col, row) {
        this.grid[row][col].visited = true;
        const directions = this.#shuffle(['top', 'right', 'bottom', 'left']);

        for (const dir of directions) {
            const [nextCol, nextRow] = this.#getNeighbor(col, row, dir);

            if (this.#isValid(nextCol, nextRow) && !this.grid[nextRow][nextCol].visited) {
                // Remove walls between current and next cell
                this.grid[row][col].walls[dir] = false;
                this.grid[nextRow][nextCol].walls[this.#opposite(dir)] = false;

                this.#carvePassages(nextCol, nextRow);
            }
        }
    }

    #getNeighbor(col, row, dir) {
        switch (dir) {
            case 'top': return [col, row - 1];
            case 'right': return [col + 1, row];
            case 'bottom': return [col, row + 1];
            case 'left': return [col - 1, row];
        }
    }

    #opposite(dir) {
        const opposites = { top: 'bottom', right: 'left', bottom: 'top', left: 'right' };
        return opposites[dir];
    }

    #isValid(col, row) {
        return col >= 0 && col < this.cols && row >= 0 && row < this.rows;
    }

    #shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    #buildWalls() {
        this.walls = [];
        const cs = this.cellSize;
        const wallThickness = 4;

        // Outer boundaries
        this.walls.push({ x1: 0, y1: 0, x2: this.width, y2: 0 }); // Top
        this.walls.push({ x1: this.width, y1: 0, x2: this.width, y2: this.height }); // Right
        this.walls.push({ x1: 0, y1: this.height, x2: this.width, y2: this.height }); // Bottom
        this.walls.push({ x1: 0, y1: 0, x2: 0, y2: this.height }); // Left

        // Internal walls from grid
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = this.grid[row][col];
                const x = col * cs;
                const y = row * cs;

                if (cell.walls.right && col < this.cols - 1) {
                    this.walls.push({
                        x1: x + cs, y1: y,
                        x2: x + cs, y2: y + cs
                    });
                }
                if (cell.walls.bottom && row < this.rows - 1) {
                    this.walls.push({
                        x1: x, y1: y + cs,
                        x2: x + cs, y2: y + cs
                    });
                }
            }
        }
    }

    draw(ctx) {
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';

        // Draw all walls
        for (const wall of this.walls) {
            ctx.beginPath();
            ctx.moveTo(wall.x1, wall.y1);
            ctx.lineTo(wall.x2, wall.y2);
            ctx.stroke();
        }

        // Draw start zone
        ctx.fillStyle = 'rgba(0, 200, 100, 0.3)';
        ctx.fillRect(0, 0, this.cellSize, this.cellSize);
        ctx.fillStyle = '#0a0';
        ctx.font = '12px monospace';
        ctx.fillText('START', 5, 15);

        // Draw goal zone
        ctx.fillStyle = 'rgba(255, 200, 0, 0.3)';
        ctx.fillRect(
            (this.cols - 1) * this.cellSize,
            (this.rows - 1) * this.cellSize,
            this.cellSize,
            this.cellSize
        );
        ctx.fillStyle = '#c80';
        ctx.fillText('GOAL', (this.cols - 1) * this.cellSize + 5, (this.rows - 1) * this.cellSize + 15);
    }

    // Check line-segment intersection for raycasting
    getIntersection(ray, wall) {
        const { x1: x1, y1: y1, x2: x2, y2: y2 } = wall;
        const { x: x3, y: y3, dx, dy, length } = ray;
        const x4 = x3 + dx * length;
        const y4 = y3 + dy * length;

        const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (denom === 0) return null;

        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
        const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

        if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
            return {
                x: x1 + t * (x2 - x1),
                y: y1 + t * (y2 - y1),
                offset: u
            };
        }
        return null;
    }

    // Check if point is at goal
    isAtGoal(x, y, radius) {
        const dx = x - this.goal.x;
        const dy = y - this.goal.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist < this.cellSize * 0.4;
    }

    // Get distance to goal (normalized)
    getDistanceToGoal(x, y) {
        const dx = this.goal.x - x;
        const dy = this.goal.y - y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Get angle to goal (normalized -1 to 1)
    getAngleToGoal(x, y, agentAngle) {
        const dx = this.goal.x - x;
        const dy = this.goal.y - y;
        const angleToGoal = Math.atan2(dy, dx);
        let relativeAngle = angleToGoal - agentAngle;

        // Normalize to -PI to PI
        while (relativeAngle > Math.PI) relativeAngle -= 2 * Math.PI;
        while (relativeAngle < -Math.PI) relativeAngle += 2 * Math.PI;

        // Normalize to -1 to 1
        return relativeAngle / Math.PI;
    }
}
