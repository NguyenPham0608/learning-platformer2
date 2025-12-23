// main.js
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const popSize = 900;
const ga = new GeneticAlgorithm(popSize, 5, 8, 3);
let cubes = [];
let bestCube = null;
let simTime = 0;
const maxSimTime = 60;
let replayMode = false;
let showSensors = false;
let cameraX = 0;

document.getElementById('saveBest').addEventListener('click', () => {
    if (bestCube) {
        localStorage.setItem('bestBrain', JSON.stringify(bestCube.brain));
        alert('Best brain saved!');
    }
});

document.getElementById('loadBest').addEventListener('click', () => {
    const saved = localStorage.getItem('bestBrain');
    if (saved) {
        const loadedBrain = JSON.parse(saved);
        // Reconstruct NeuralNetwork from JSON
        const nn = new NeuralNetwork(5, 8, 3);
        Object.assign(nn, loadedBrain);
        ga.population[0] = nn; // Replace first
        alert('Best brain loaded into population!');
    }
});

document.getElementById('toggleReplay').addEventListener('click', () => {
    replayMode = !replayMode;
    initGeneration();
});

document.getElementById('toggleSensors').addEventListener('click', () => {
    showSensors = !showSensors;
});

function initGeneration() {
    if (replayMode) {
        cubes = [new Cube(ga.getBestBrain())];
    } else {
        cubes = ga.population.map(brain => new Cube(brain));
    }
    simTime = 0;
}

function update(dt) {
    simTime += dt;
    let allDead = true;

    for (let cube of cubes) {
        if (cube.alive) {
            cube.update(dt);
            if (cube.x >= finishX) {
                cube.alive = false; // Reached end
            }
            allDead = false;
        }
    }

    if (allDead || simTime > maxSimTime) {
        if (!replayMode) {
            const fitnesses = cubes.map(cube => cube.getFitness());
            ga.nextGeneration(fitnesses);
        }
        initGeneration();
    }

    // Update best
    bestCube = cubes.reduce((best, current) => (current.maxX > best.maxX ? current : best), cubes[0]);

    // Camera follow best
    cameraX = Math.max(0, bestCube.x - canvas.width / 4);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw platforms
    ctx.fillStyle = 'green';
    for (let plat of platforms) {
        ctx.fillRect(plat.x - cameraX, plat.y, plat.width, 5);
    }

    // Draw hazards
    ctx.fillStyle = 'red';
    for (let haz of hazards) {
        ctx.fillRect(haz.x - cameraX, haz.y - haz.height, haz.width, haz.height);
    }

    // Draw finish
    ctx.fillStyle = 'gold';
    ctx.fillRect(finishX - cameraX, 0, 10, canvas.height);

    // Draw cubes
    for (let cube of cubes) {
        if (!cube.alive && !replayMode) continue;
        ctx.globalAlpha = (cube === bestCube) ? 1 : 0.3;
        ctx.fillStyle = 'blue';
        ctx.fillRect(cube.x - cameraX - cube.size / 2, cube.y - cube.size / 2, cube.size, cube.size);
    }
    ctx.globalAlpha = 1;

    // Draw sensors for best
    if (showSensors && bestCube) {
        drawSensors(ctx, bestCube, cameraX);
    }

    // Draw NN for best
    if (bestCube) {
        drawNeuralNetwork(ctx, bestCube.brain, canvas.width - 300, 10, 280, 200);
    }

    // Text
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText(`Generation: ${ga.generation}`, 10, 30);
    ctx.fillText(`Best Distance: ${Math.floor(bestCube.maxX - startX)}`, 10, 60);
    ctx.fillText(replayMode ? 'Replay Mode' : 'Training Mode', 10, 90);
}

let lastTime = 0;
function loop(timestamp) {
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    update(dt);
    draw();

    requestAnimationFrame(loop);
}

initGeneration();
requestAnimationFrame(loop);