// level.js
const platforms = [
    { x: 0, width: 400, y: 400 }, // Ground
    { x: 500, width: 200, y: 400 }, // After gap
    { x: 750, width: 150, y: 350 }, // Raised platform
    { x: 950, width: 300, y: 400 }, // More ground
    { x: 1300, width: 200, y: 300 }, // Higher platform
    { x: 1550, width: 250, y: 400 }, // Ground again
    { x: 1850, width: 150, y: 350 }, // Small raised
    { x: 2050, width: 400, y: 400 }, // Long ground
    { x: 2500, width: 200, y: 400 }, // After another gap
    { x: 2750, width: 300, y: 350 }, // Raised
];

const hazards = [
    // Optional spikes: { x: 600, width: 50, y: 400, height: 20 },
];

const finishX = 3000;
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