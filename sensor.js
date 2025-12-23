// sensor.js
const maxSensorDist = 200;
const maxHeightDiff = 100;
const maxVelY = 10;

function getSensors(cube) {
    const scanX = cube.x; // Center
    const currentY = getFloorY(scanX);
    if (currentY === Infinity) {
        return [0, -1, 0, cube.velY / maxVelY, 0]; // Dead anyway
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

    // Normalize
    const normDistEdge = distToEdge / maxSensorDist;
    const normHeightDiff = Math.max(Math.min(heightDiff / maxHeightDiff, 1), -1);
    const normDistGap = distToGap / maxSensorDist;
    const normVelY = Math.max(Math.min(cube.velY / maxVelY, 1), -1);
    const onGround = cube.onGround ? 1 : 0;

    return [normDistEdge, normHeightDiff, normDistGap, normVelY, onGround];
}