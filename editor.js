// editor.js
let editorMode = false;
let currentTool = 'platform';
let isDrawing = false;
let drawStart = null;
let lastMouseX = 0;
let lastMouseY = 0;

document.getElementById('toggleEditor').addEventListener('click', () => {
    editorMode = !editorMode;
    document.getElementById('toggleEditor').textContent = editorMode ? 'Exit Editor' : 'Toggle Editor';
});

document.getElementById('toolSelect').addEventListener('change', (e) => {
    currentTool = e.target.value;
});

document.getElementById('clearLevel').addEventListener('click', () => {
    if (confirm('Clear level?')) {
        platforms = [];
        hazards = [];
    }
});

// Arrow key scrolling
document.addEventListener('keydown', (e) => {
    if (!editorMode) return;
    const scrollSpeed = 20;
    if (e.key === 'ArrowLeft') {
        cameraX = Math.max(0, cameraX - scrollSpeed);
    } else if (e.key === 'ArrowRight') {
        cameraX += scrollSpeed;
    }
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    lastMouseX = e.clientX - rect.left + cameraX;
    lastMouseY = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', (e) => {
    if (!editorMode) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left + cameraX;
    const y = e.clientY - rect.top;

    if (currentTool === 'start') {
        startX = x;
        startY = y;
    } else if (currentTool === 'finish') {
        finishX = x;
    } else if (currentTool === 'erase') {
        eraseAt(x, y);
    } else {
        isDrawing = true;
        drawStart = { x, y };
    }
});

canvas.addEventListener('mouseup', (e) => {
    if (!editorMode || !isDrawing) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left + cameraX;
    const y = e.clientY - rect.top;

    const dx = Math.abs(x - drawStart.x);
    const dy = Math.abs(y - drawStart.y);

    if (dx > 5 || dy > 5) {
        let line;
        if (dx > dy) {
            line = { x1: drawStart.x, y1: drawStart.y, x2: x, y2: drawStart.y };
        } else {
            line = { x1: drawStart.x, y1: drawStart.y, x2: drawStart.x, y2: y };
        }

        if (currentTool === 'platform') {
            platforms.push(line);
        } else if (currentTool === 'hazard') {
            hazards.push(line);
        }
    }

    isDrawing = false;
    drawStart = null;
});

function eraseAt(x, y) {
    const threshold = 15;
    for (let i = platforms.length - 1; i >= 0; i--) {
        if (nearLine(x, y, platforms[i], threshold)) {
            platforms.splice(i, 1);
            return;
        }
    }
    for (let i = hazards.length - 1; i >= 0; i--) {
        if (nearLine(x, y, hazards[i], threshold)) {
            hazards.splice(i, 1);
            return;
        }
    }
}

function nearLine(px, py, line, t) {
    const minX = Math.min(line.x1, line.x2) - t;
    const maxX = Math.max(line.x1, line.x2) + t;
    const minY = Math.min(line.y1, line.y2) - t;
    const maxY = Math.max(line.y1, line.y2) + t;
    if (px < minX || px > maxX || py < minY || py > maxY) return false;
    if (line.y1 === line.y2) return Math.abs(py - line.y1) < t;
    return Math.abs(px - line.x1) < t;
}

function drawEditorOverlay() {
    if (!editorMode) return;

    // Draw start point
    ctx.fillStyle = 'blue';
    ctx.beginPath();
    ctx.arc(startX - cameraX, startY, 8, 0, Math.PI * 2);
    ctx.fill();

    // Preview line while drawing
    if (isDrawing && drawStart) {
        const dx = Math.abs(lastMouseX - drawStart.x);
        const dy = Math.abs(lastMouseY - drawStart.y);
        let endX, endY;
        if (dx > dy) {
            endX = lastMouseX;
            endY = drawStart.y;
        } else {
            endX = drawStart.x;
            endY = lastMouseY;
        }

        ctx.strokeStyle = currentTool === 'hazard' ? 'red' : 'green';
        ctx.lineWidth = 5;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(drawStart.x - cameraX, drawStart.y);
        ctx.lineTo(endX - cameraX, endY);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    // Editor mode text
    ctx.fillStyle = 'black';
    ctx.font = '16px Arial';
    ctx.fillText('EDITOR MODE (Arrow keys to scroll)', 10, canvas.height - 10);
}