// visualizer.js
function drawNeuralNetwork(ctx, network, x, y, width, height) {
    const margin = 10;
    const left = x + margin;
    const top = y + margin;
    const layerWidth = (width - margin * 2) / 3; // 3 layers: input, hidden, output

    // Draw input nodes
    for (let i = 0; i < network.inputNodes; i++) {
        const nodeY = top + (height / (network.inputNodes + 1)) * (i + 1);
        ctx.beginPath();
        ctx.arc(left, nodeY, 10, 0, Math.PI * 2);
        ctx.fillStyle = 'gray';
        ctx.fill();
    }

    // Draw hidden nodes
    const hiddenLeft = left + layerWidth;
    for (let i = 0; i < network.hiddenNodes; i++) {
        const nodeY = top + (height / (network.hiddenNodes + 1)) * (i + 1);
        ctx.beginPath();
        ctx.arc(hiddenLeft, nodeY, 10, 0, Math.PI * 2);
        ctx.fillStyle = 'gray';
        ctx.fill();
    }

    // Draw output nodes
    const outputLeft = hiddenLeft + layerWidth;
    for (let i = 0; i < network.outputNodes; i++) {
        const nodeY = top + (height / (network.outputNodes + 1)) * (i + 1);
        ctx.beginPath();
        ctx.arc(outputLeft, nodeY, 10, 0, Math.PI * 2);
        ctx.fillStyle = 'gray';
        ctx.fill();
    }

    // Draw connections (simplified, not showing weights)
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    for (let i = 0; i < network.inputNodes; i++) {
        const inY = top + (height / (network.inputNodes + 1)) * (i + 1);
        for (let j = 0; j < network.hiddenNodes; j++) {
            const hidY = top + (height / (network.hiddenNodes + 1)) * (j + 1);
            ctx.beginPath();
            ctx.moveTo(left, inY);
            ctx.lineTo(hiddenLeft, hidY);
            ctx.stroke();
        }
    }
    for (let i = 0; i < network.hiddenNodes; i++) {
        const hidY = top + (height / (network.hiddenNodes + 1)) * (i + 1);
        for (let j = 0; j < network.outputNodes; j++) {
            const outY = top + (height / (network.outputNodes + 1)) * (j + 1);
            ctx.beginPath();
            ctx.moveTo(hiddenLeft, hidY);
            ctx.lineTo(outputLeft, outY);
            ctx.stroke();
        }
    }
}

function drawSensors(ctx, cube, cameraX) {
    const [distEdge, heightDiff, distGap, ,] = getSensors(cube);
    const scanX = cube.x - cameraX;
    const scanY = cube.y;

    // Draw line to next edge
    ctx.strokeStyle = 'blue';
    ctx.beginPath();
    ctx.moveTo(scanX, scanY);
    ctx.lineTo(scanX + distEdge * maxSensorDist, scanY);
    ctx.stroke();

    // Draw line to gap
    ctx.strokeStyle = 'red';
    ctx.beginPath();
    ctx.moveTo(scanX, scanY);
    ctx.lineTo(scanX + distGap * maxSensorDist, scanY + 20); // Offset for visibility
    ctx.stroke();
}