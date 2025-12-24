// level.js
let platforms = [
    { x1: 0, y1: 400, x2: 400, y2: 400 }
];
let hazards = [];
let finishX = 3000;
const deathY = 600;
let startX = 50;
let startY = 380;

function getFloorY(atX) {
    let bestY = Infinity;
    for (let plat of platforms) {
        const isHorizontal = plat.y1 === plat.y2;
        if (!isHorizontal) continue;

        const minX = Math.min(plat.x1, plat.x2);
        const maxX = Math.max(plat.x1, plat.x2);
        if (atX >= minX && atX <= maxX) {
            if (plat.y1 < bestY) bestY = plat.y1;
        }
    }
    return bestY;
}

function getFloorYBelow(atX, belowY) {
    let bestY = Infinity;
    for (let plat of platforms) {
        const isHorizontal = plat.y1 === plat.y2;
        if (!isHorizontal) continue;

        const minX = Math.min(plat.x1, plat.x2);
        const maxX = Math.max(plat.x1, plat.x2);
        if (atX >= minX && atX <= maxX) {
            // Only count platforms below the given Y
            if (plat.y1 > belowY && plat.y1 < bestY) {
                bestY = plat.y1;
            }
        }
    }
    return bestY;
}

function getCeilingY(atX, aboveY) {
    let bestY = -Infinity;
    for (let plat of platforms) {
        const isHorizontal = plat.y1 === plat.y2;
        if (!isHorizontal) continue;

        const minX = Math.min(plat.x1, plat.x2);
        const maxX = Math.max(plat.x1, plat.x2);
        if (atX >= minX && atX <= maxX) {
            // Only count platforms above the given Y
            if (plat.y1 < aboveY && plat.y1 > bestY) {
                bestY = plat.y1;
            }
        }
    }
    return bestY;
}

function checkHazardCollision(cube) {
    const cubeLeft = cube.x - cube.size / 2;
    const cubeRight = cube.x + cube.size / 2;
    const cubeTop = cube.y - cube.size / 2;
    const cubeBottom = cube.y + cube.size / 2;

    for (let haz of hazards) {
        const isHorizontal = haz.y1 === haz.y2;
        if (isHorizontal) {
            const minX = Math.min(haz.x1, haz.x2);
            const maxX = Math.max(haz.x1, haz.x2);
            if (cubeRight > minX && cubeLeft < maxX &&
                cubeBottom > haz.y1 - 10 && cubeTop < haz.y1 + 10) {
                return true;
            }
        } else {
            const minY = Math.min(haz.y1, haz.y2);
            const maxY = Math.max(haz.y1, haz.y2);
            if (cubeBottom > minY && cubeTop < maxY &&
                cubeRight > haz.x1 - 10 && cubeLeft < haz.x1 + 10) {
                return true;
            }
        }
    }
    return false;
}

function checkWallCollision(cube, newX) {
    const cubeTop = cube.y - cube.size / 2;
    const cubeBottom = cube.y + cube.size / 2;

    for (let plat of platforms) {
        const isVertical = plat.x1 === plat.x2;
        if (!isVertical) continue;

        const wallX = plat.x1;
        const minY = Math.min(plat.y1, plat.y2);
        const maxY = Math.max(plat.y1, plat.y2);

        if (cubeBottom > minY && cubeTop < maxY) {
            const oldLeft = cube.x - cube.size / 2;
            const oldRight = cube.x + cube.size / 2;
            const newLeft = newX - cube.size / 2;
            const newRight = newX + cube.size / 2;

            // Moving right into wall
            if (oldRight <= wallX && newRight > wallX) {
                return { hit: true, x: wallX - cube.size / 2 };
            }
            // Moving left into wall
            if (oldLeft >= wallX && newLeft < wallX) {
                return { hit: true, x: wallX + cube.size / 2 };
            }
        }
    }
    return { hit: false };
}

// Add at the end of level.js

function saveLevel() {
    const levelData = {
        platforms: platforms,
        hazards: hazards,
        startX: startX,
        startY: startY,
        finishX: finishX
    };
    localStorage.setItem('savedLevel', JSON.stringify(levelData));
}

function loadLevel() {
    const saved = localStorage.getItem('savedLevel');
    if (saved) {
        const levelData = JSON.parse(saved);
        platforms = levelData.platforms || [{ x1: 0, y1: 400, x2: 400, y2: 400 }];
        hazards = levelData.hazards || [];
        startX = levelData.startX || 50;
        startY = levelData.startY || 380;
        finishX = levelData.finishX || 3000;
        return true;
    }
    return false;
}

// Load level on startup
loadLevel();