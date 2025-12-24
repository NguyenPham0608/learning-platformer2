// sensor.js
const maxSensorDist = 200;
const maxHeightDiff = 100;
const maxVelY = 10;

function getSensors(cube) {
    const scanX = cube.x;
    const currentY = getFloorY(scanX);
    if (currentY === Infinity) {
        return [0, 0, 0, 0, 0, 0, cube.velY / maxVelY, 0]; // 8 inputs now
    }

    // === RIGHT-SIDE SENSORS ===
    let distToEdgeR = maxSensorDist;
    let heightDiffR = 0;
    let distToGapR = maxSensorDist;

    let prevY = currentY;
    for (let d = 1; d <= maxSensorDist; d++) {
        const nx = scanX + d;
        const ny = getFloorY(nx);
        if (ny !== prevY) {
            distToEdgeR = d;
            heightDiffR = (ny === Infinity) ? -maxHeightDiff : (ny - currentY);
            break;
        }
    }

    for (let d = 1; d <= maxSensorDist; d++) {
        const nx = scanX + d;
        const ny = getFloorY(nx);
        if (ny === Infinity) {
            distToGapR = d;
            break;
        }
    }

    // === LEFT-SIDE SENSORS ===
    let distToEdgeL = maxSensorDist;
    let heightDiffL = 0;
    let distToGapL = maxSensorDist;

    prevY = currentY;
    for (let d = 1; d <= maxSensorDist; d++) {
        const nx = scanX - d; // Scan LEFT
        const ny = getFloorY(nx);
        if (ny !== prevY) {
            distToEdgeL = d;
            heightDiffL = (ny === Infinity) ? -maxHeightDiff : (ny - currentY);
            break;
        }
    }

    for (let d = 1; d <= maxSensorDist; d++) {
        const nx = scanX - d; // Scan LEFT
        const ny = getFloorY(nx);
        if (ny === Infinity) {
            distToGapL = d;
            break;
        }
    }

    // Normalize all values
    const normDistEdgeR = distToEdgeR / maxSensorDist;
    const normHeightDiffR = Math.max(Math.min(heightDiffR / maxHeightDiff, 1), -1);
    const normDistGapR = distToGapR / maxSensorDist;

    const normDistEdgeL = distToEdgeL / maxSensorDist;
    const normHeightDiffL = Math.max(Math.min(heightDiffL / maxHeightDiff, 1), -1);
    const normDistGapL = distToGapL / maxSensorDist;

    const normVelY = Math.max(Math.min(cube.velY / maxVelY, 1), -1);
    const onGround = cube.onGround ? 1 : 0;

    // 8 inputs: [rightEdge, rightHeight, rightGap, leftEdge, leftHeight, leftGap, velY, onGround]
    return [normDistEdgeR, normHeightDiffR, normDistGapR, normDistEdgeL, normHeightDiffL, normDistGapL, normVelY, onGround];
}