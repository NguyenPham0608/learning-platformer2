// sensor.js
const maxSensorDist = 200;
const maxHeightDiff = 100;
const maxVelY = 500;

function getSensors(cube) {
    const scanX = cube.x;
    const currentY = getFloorY(scanX);

    // Right sensors
    let distToEdgeR = maxSensorDist;
    let heightDiffR = 0;
    let distToGapR = maxSensorDist;

    if (currentY !== Infinity) {
        for (let d = 1; d <= maxSensorDist; d++) {
            const ny = getFloorY(scanX + d);
            if (ny !== currentY) {
                distToEdgeR = d;
                heightDiffR = (ny === Infinity) ? -maxHeightDiff : (ny - currentY);
                break;
            }
        }
        for (let d = 1; d <= maxSensorDist; d++) {
            if (getFloorY(scanX + d) === Infinity) {
                distToGapR = d;
                break;
            }
        }
    }

    // Left sensors
    let distToEdgeL = maxSensorDist;
    let heightDiffL = 0;
    let distToGapL = maxSensorDist;

    if (currentY !== Infinity) {
        for (let d = 1; d <= maxSensorDist; d++) {
            const ny = getFloorY(scanX - d);
            if (ny !== currentY) {
                distToEdgeL = d;
                heightDiffL = (ny === Infinity) ? -maxHeightDiff : (ny - currentY);
                break;
            }
        }
        for (let d = 1; d <= maxSensorDist; d++) {
            if (getFloorY(scanX - d) === Infinity) {
                distToGapL = d;
                break;
            }
        }
    }

    // Wall sensors
    let wallDistR = maxSensorDist;
    let wallDistL = maxSensorDist;
    for (let plat of platforms) {
        if (plat.x1 !== plat.x2) continue;
        const wallX = plat.x1;
        const minY = Math.min(plat.y1, plat.y2);
        const maxY = Math.max(plat.y1, plat.y2);
        if (cube.y > minY && cube.y < maxY) {
            if (wallX > scanX && wallX - scanX < wallDistR) {
                wallDistR = wallX - scanX;
            }
            if (wallX < scanX && scanX - wallX < wallDistL) {
                wallDistL = scanX - wallX;
            }
        }
    }

    // Goal direction
    let goalDirection = (finishX - cube.x) / 1000;
    goalDirection = Math.max(-1, Math.min(1, goalDirection));

    // Against wall signals (strong signal to go other way)
    let againstWallR = cube.againstWallRight ? 1 : 0;
    let againstWallL = cube.againstWallLeft ? 1 : 0;

    // Current movement direction
    let movingDir = Math.max(-1, Math.min(1, cube.velX / 200));

    return [
        distToEdgeR / maxSensorDist,
        Math.max(-1, Math.min(1, heightDiffR / maxHeightDiff)),
        distToGapR / maxSensorDist,
        distToEdgeL / maxSensorDist,
        Math.max(-1, Math.min(1, heightDiffL / maxHeightDiff)),
        distToGapL / maxSensorDist,
        Math.max(-1, Math.min(1, cube.velY / maxVelY)),
        cube.onGround ? 1 : 0,
        wallDistR / maxSensorDist,
        wallDistL / maxSensorDist,
        goalDirection,
        againstWallR,
        againstWallL,
        movingDir
    ];
}