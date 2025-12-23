// sensor.js
const maxSensorDist = 300;
const maxHeightDiff = 100;
const maxVelY = 10;
const maxVelX = 500;

function getSensors(cube) {
    const scanX = cube.x; // Center
    const currentY = getFloorY(scanX);
    if (currentY === Infinity) {
        return [0, -1, 0, cube.velY / maxVelY, 0, 0, 0]; // Dead anyway
    }

    let distToEdge = maxSensorDist;
    let heightDiff = 0;
    let distToGap = maxSensorDist;

    // Scan for next edge (change in floor Y)
    let prevY = currentY;
    for (let d = 1; d <= maxSensorDist; d++) {
        const nx = scanX + d;
        const ny = getFloorY(nx);
        if (ny !== prevY) {
            distToEdge = d;
            heightDiff = (ny === Infinity) ? -maxHeightDiff : (ny - currentY);
            prevY = ny;
            break;
        }
    }

    // Scan for next gap (to Infinity)
    for (let d = 1; d <= maxSensorDist; d++) {
        const nx = scanX + d;
        const ny = getFloorY(nx);
        if (ny === Infinity) {
            distToGap = d;
            break;
        }
    }

    // Scan for next hazard
    const distToHazard = getNextHazardDist(scanX, currentY);

    // Normalize
    const normDistEdge = distToEdge / maxSensorDist;
    const normHeightDiff = Math.max(Math.min(heightDiff / maxHeightDiff, 1), -1);
    const normDistGap = distToGap / maxSensorDist;
    const normVelY = Math.max(Math.min(cube.velY / maxVelY, 1), -1);
    const onGround = cube.onGround ? 1 : 0;
    const normVelX = Math.max(Math.min(cube.velX / maxVelX, 1), -1);
    const normDistHazard = distToHazard / maxSensorDist;

    return [normDistEdge, normHeightDiff, normDistGap, normVelY, onGround, normVelX, normDistHazard];
}