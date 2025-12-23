// level.js
const platforms = [
    { x: 0, width: 500, y: 400 }, // Starting ground
    { x: 600, width: 200, y: 400 }, // After small gap
    { x: 850, width: 150, y: 350 }, // Raised platform
    { x: 1050, width: 300, y: 400 }, // Ground with spike
    { x: 1400, width: 100, y: 300 }, // High small platform
    { x: 1550, width: 250, y: 400 }, // Ground after jump
    { x: 1850, width: 200, y: 350 }, // Raised with spike
    { x: 2100, width: 400, y: 400 }, // Long ground
    { x: 2550, width: 150, y: 300 }, // High platform
    { x: 2750, width: 300, y: 400 }, // Ground with lava-like hazard
    { x: 3100, width: 200, y: 350 }, // Raised
    { x: 3350, width: 250, y: 400 }, // Final ground before finish
];

const hazards = [
    { x: 1100, width: 50, y: 400, height: 20 }, // Spike on platform
    { x: 1900, width: 50, y: 350, height: 20 }, // Spike on raised
    { x: 2800, width: 100, y: 400, height: 20 }, // Lava-like wide spike
    { x: 2400, width: 50, y: 400, height: 20 }, // Spike in long ground
];

const finishX = 3600;
const deathY = 600;
const startX = 50;
const startY = 380; // Above first platform

function getFloorY(atX) {
    for (let plat of platforms) {
        if (atX >= plat.x && atX < plat.x + plat.width) {
            return plat.y;
        }
    }
    return Infinity;
}

function checkHazardCollision(cube) {
    const cubeLeft = cube.x - cube.size / 2;
    const cubeRight = cube.x + cube.size / 2;
    const cubeTop = cube.y - cube.size / 2;
    const cubeBottom = cube.y + cube.size / 2;

    for (let hazard of hazards) {
        const hazLeft = hazard.x;
        const hazRight = hazard.x + hazard.width;
        const hazTop = hazard.y - hazard.height;
        const hazBottom = hazard.y;

        if (cubeRight > hazLeft && cubeLeft < hazRight && cubeBottom > hazTop && cubeTop < hazBottom) {
            return true;
        }
    }
    return false;
}

function getNextHazardDist(scanX, currentY) {
    const maxHazardDist = 300;
    let distToHazard = maxHazardDist;

    for (let d = 1; d <= maxHazardDist; d++) {
        const nx = scanX + d;
        let inHazard = false;
        for (let haz of hazards) {
            if (nx >= haz.x && nx < haz.x + haz.width &&
                currentY >= haz.y - haz.height && currentY <= haz.y) {
                inHazard = true;
                break;
            }
        }
        if (inHazard) {
            distToHazard = d;
            break;
        }
    }
    return distToHazard;
}