/**
 * 3D View Module using Three.js
 * Renders the maze from the best agent's perspective in true 3D
 */

class View3D {
    constructor(canvas) {
        this.canvas = canvas;
        this.width = canvas.width;
        this.height = canvas.height;

        // Three.js setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);
        this.scene.fog = new THREE.Fog(0x1a1a2e, 100, 500);

        // Camera - wider FOV for less claustrophobic feel
        this.camera = new THREE.PerspectiveCamera(110, this.width / this.height, 1, 1000);
        this.camera.position.y = 20;

        this.smoothedAngle = 0;

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        this.renderer.setSize(this.width, this.height);
        this.renderer.shadowMap.enabled = true;

        // Lighting
        this.setupLighting();

        // Maze geometry
        this.mazeGroup = new THREE.Group();
        this.scene.add(this.mazeGroup);
        this.currentMaze = null;

        // Goal marker
        this.goalMarker = null;
    }

    setupLighting() {
        // Ambient light for base visibility
        const ambient = new THREE.AmbientLight(0x6080a0, 0.7);
        this.scene.add(ambient);

        // Hemisphere light for natural feel
        const hemi = new THREE.HemisphereLight(0x8090b0, 0x404050, 0.6);
        this.scene.add(hemi);

        // Point light that follows camera
        this.flashlight = new THREE.PointLight(0xffffff, 0.6, 250);
        this.scene.add(this.flashlight);
    }

    buildMaze(maze) {
        // Clear existing maze
        while (this.mazeGroup.children.length > 0) {
            const obj = this.mazeGroup.children[0];
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
            this.mazeGroup.remove(obj);
        }

        const wallHeight = 50;
        const wallThickness = 4;

        // Wall materials
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x7ab0c8,
            roughness: 0.6,
            metalness: 0.1,
        });

        const darkWallMaterial = new THREE.MeshStandardMaterial({
            color: 0x5a90a8,
            roughness: 0.7,
            metalness: 0.1,
        });

        // Build walls
        for (const wall of maze.walls) {
            const dx = wall.x2 - wall.x1;
            const dy = wall.y2 - wall.y1;
            const length = Math.sqrt(dx * dx + dy * dy);

            if (length < 1) continue;

            const geometry = new THREE.BoxGeometry(length, wallHeight, wallThickness);
            const isVertical = Math.abs(dx) < Math.abs(dy);
            const material = isVertical ? darkWallMaterial : wallMaterial;
            const wallMesh = new THREE.Mesh(geometry, material);

            wallMesh.position.x = (wall.x1 + wall.x2) / 2;
            wallMesh.position.z = (wall.y1 + wall.y2) / 2;
            wallMesh.position.y = wallHeight / 2;
            wallMesh.rotation.y = Math.atan2(dy, dx);
            wallMesh.castShadow = true;
            wallMesh.receiveShadow = true;

            this.mazeGroup.add(wallMesh);
        }

        // Floor
        const floorGeometry = new THREE.PlaneGeometry(maze.width + 200, maze.height + 200);
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: 0x3d3d54,
            roughness: 0.9,
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(maze.width / 2, 0, maze.height / 2);
        floor.receiveShadow = true;
        this.mazeGroup.add(floor);

        // Goal marker
        if (this.goalMarker) this.scene.remove(this.goalMarker);
        const goalGeometry = new THREE.CylinderGeometry(10, 10, wallHeight * 0.7, 16);
        const goalMaterial = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            emissive: 0xffa500,
            emissiveIntensity: 0.5,
        });
        this.goalMarker = new THREE.Mesh(goalGeometry, goalMaterial);
        this.goalMarker.position.set(maze.goal.x, wallHeight * 0.35, maze.goal.y);
        this.scene.add(this.goalMarker);

        // Goal light
        const goalLight = new THREE.PointLight(0xffd700, 1, 200);
        goalLight.position.set(maze.goal.x, wallHeight * 0.5, maze.goal.y);
        this.mazeGroup.add(goalLight);

        this.currentMaze = maze;
    }

    render(agent, maze) {
        if (!agent || !maze) return;

        if (this.currentMaze !== maze) {
            this.buildMaze(maze);
        }

        // Smooth the camera angle using lerp
        const lerpFactor = 0.03; // Lower = smoother but more lag, higher = more responsive

        // Handle angle wrapping for smooth interpolation
        let angleDiff = agent.angle - this.smoothedAngle;
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

        this.smoothedAngle += angleDiff * lerpFactor;

        // Keep smoothedAngle in reasonable range
        while (this.smoothedAngle > Math.PI) this.smoothedAngle -= 2 * Math.PI;
        while (this.smoothedAngle < -Math.PI) this.smoothedAngle += 2 * Math.PI;

        // Update camera position (follows agent directly)
        this.camera.position.x = agent.x;
        this.camera.position.z = agent.y;
        this.camera.position.y = 25;

        // Use smoothed angle for look direction
        const lookDist = 100;
        const lookX = agent.x + Math.cos(this.smoothedAngle) * lookDist;
        const lookZ = agent.y + Math.sin(this.smoothedAngle) * lookDist;
        this.camera.lookAt(lookX, 20, lookZ);

        // Update flashlight
        this.flashlight.position.copy(this.camera.position);

        // Animate goal
        if (this.goalMarker) {
            this.goalMarker.rotation.y += 0.02;
            this.goalMarker.position.y = 25 + Math.sin(Date.now() * 0.003) * 5;
        }

        // Render 3D scene
        this.renderer.render(this.scene, this.camera);

        // Draw 2D overlays
        const ctx = this.canvas.getContext('2d');
        this.drawMinimap(ctx, agent, maze);
        this.drawCompass(ctx, agent, maze);
    }

    drawMinimap(ctx, agent, maze) {
        const mapSize = 80;
        const padding = 10;
        const cellSize = mapSize / Math.max(maze.cols, maze.rows);
        const mapX = this.width - mapSize - padding;
        const mapY = padding;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(mapX - 2, mapY - 2, mapSize + 4, mapSize + 4);

        ctx.strokeStyle = 'rgba(100, 170, 255, 0.5)';
        ctx.lineWidth = 1;

        for (let row = 0; row < maze.rows; row++) {
            for (let col = 0; col < maze.cols; col++) {
                const cell = maze.grid[row][col];
                const cx = mapX + col * cellSize;
                const cy = mapY + row * cellSize;

                if (cell.walls.top) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + cellSize, cy); ctx.stroke(); }
                if (cell.walls.left) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy + cellSize); ctx.stroke(); }
                if (col === maze.cols - 1 && cell.walls.right) { ctx.beginPath(); ctx.moveTo(cx + cellSize, cy); ctx.lineTo(cx + cellSize, cy + cellSize); ctx.stroke(); }
                if (row === maze.rows - 1 && cell.walls.bottom) { ctx.beginPath(); ctx.moveTo(cx, cy + cellSize); ctx.lineTo(cx + cellSize, cy + cellSize); ctx.stroke(); }
            }
        }

        // Goal
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(mapX + (maze.cols - 0.5) * cellSize, mapY + (maze.rows - 0.5) * cellSize, 3, 0, Math.PI * 2);
        ctx.fill();

        // Agent
        const ax = mapX + (agent.x / maze.cellSize) * cellSize;
        const ay = mapY + (agent.y / maze.cellSize) * cellSize;
        ctx.fillStyle = '#4af';
        ctx.beginPath();
        ctx.arc(ax, ay, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#4af';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax + Math.cos(agent.angle) * 6, ay + Math.sin(agent.angle) * 6);
        ctx.stroke();
    }

    drawCompass(ctx, agent, maze) {
        const size = 30;
        const x = 20 + size;
        const y = 20 + size;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(100, 170, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();

        const angleToGoal = Math.atan2(maze.goal.y - agent.y, maze.goal.x - agent.x);
        const relativeAngle = angleToGoal - agent.angle;

        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(relativeAngle) * (size - 5), y + Math.sin(relativeAngle) * (size - 5));
        ctx.lineTo(x + Math.cos(relativeAngle + 2.5) * 8, y + Math.sin(relativeAngle + 2.5) * 8);
        ctx.lineTo(x + Math.cos(relativeAngle - 2.5) * 8, y + Math.sin(relativeAngle - 2.5) * 8);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#888';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GOAL', x, y + size + 12);
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
}