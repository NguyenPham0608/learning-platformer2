/**
 * Main Simulation Controller
 * Handles game loop, UI, and coordinates all modules
 */

class Simulation {
    constructor() {
        // Canvas setup
        this.canvas = document.getElementById('mazeCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Configuration
        this.config = {
            mazeCols: 6,
            mazeRows: 6,
            cellSize: 60,
            populationSize: 1500,
            maxGenerationTime: 600, // frames before auto-next generation
            showSensors: false,
            showOnlyBest: false,
            autoEvolve: true,
            simulationSpeed: 1
        };

        // Update canvas size based on maze
        this.#updateCanvasSize();

        // Initialize components
        this.maze = new Maze(
            this.config.mazeCols,
            this.config.mazeRows,
            this.config.cellSize
        );

        this.ga = new GeneticAlgorithm({
            populationSize: this.config.populationSize,
            eliteCount: 5,
            mutationRate: 0.3,
            mutationAmount: 0.3
        });

        this.agents = [];
        this.frameCount = 0;
        this.running = false;
        this.bestAgent = null;

        // Initialize population
        this.#initPopulation();

        // Bind UI
        this.#setupUI();

        // Start loop
        this.#gameLoop();
    }

    #updateCanvasSize() {
        this.canvas.width = this.config.mazeCols * this.config.cellSize;
        this.canvas.height = this.config.mazeRows * this.config.cellSize;
    }

    #initPopulation(brains = null) {
        this.agents = [];

        for (let i = 0; i < this.config.populationSize; i++) {
            const brain = brains ? brains[i] : null;
            const agent = new Agent(
                this.maze.start.x,
                this.maze.start.y,
                this.maze,
                brain
            );
            this.agents.push(agent);
        }

        this.frameCount = 0;
        this.bestAgent = this.agents[0];
    }

    #gameLoop() {
        requestAnimationFrame(() => this.#gameLoop());

        if (!this.running) return;

        for (let i = 0; i < this.config.simulationSpeed; i++) {
            this.#update();
        }
        this.#render();
    }

    #update() {
        this.frameCount++;

        // Update all agents
        let aliveCount = 0;
        let bestFitness = -Infinity;

        for (const agent of this.agents) {
            if (agent.alive) {
                agent.update();
                aliveCount++;
            }

            const fitness = agent.getFitness();
            if (fitness > bestFitness) {
                bestFitness = fitness;
                this.bestAgent = agent;
            }
        }

        // Check if generation is complete
        const generationComplete =
            aliveCount === 0 ||
            this.frameCount >= this.config.maxGenerationTime ||
            this.agents.some(a => a.reachedGoal);

        if (generationComplete && this.config.autoEvolve) {
            this.#nextGeneration();
        }

        // Update stats display
        this.#updateStats(aliveCount);
    }

    #render() {
        // Clear canvas
        this.ctx.fillStyle = '#f5f5f5';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw maze
        this.maze.draw(this.ctx);

        // Draw agents
        if (this.config.showOnlyBest) {
            // Only draw best agent
            if (this.bestAgent) {
                this.bestAgent.draw(this.ctx, this.config.showSensors);
            }
        } else {
            // Draw all agents (dead ones faded)
            for (const agent of this.agents) {
                const isBest = agent === this.bestAgent;
                agent.draw(this.ctx, isBest && this.config.showSensors);
            }

            // Draw best on top
            if (this.bestAgent) {
                this.bestAgent.draw(this.ctx, this.config.showSensors);
            }
        }
    }

    #nextGeneration(regenerateMaze = false) {
        // Evolve population
        const newBrains = this.ga.evolve(this.agents);

        // Optionally regenerate maze
        if (regenerateMaze) {
            this.maze.generate();
        }

        // Create new population with evolved brains
        this.#initPopulation(newBrains);

        // Update generation display
        document.getElementById('generation').textContent = this.ga.generation;
    }

    #updateStats(aliveCount) {
        document.getElementById('alive').textContent = aliveCount;
        document.getElementById('frame').textContent = this.frameCount;
        document.getElementById('bestFitness').textContent =
            this.bestAgent ? this.bestAgent.getFitness().toFixed(2) : '0';

        const goalsReached = this.agents.filter(a => a.reachedGoal).length;
        document.getElementById('goals').textContent = goalsReached;
    }

    #setupUI() {
        // Start/Pause button
        document.getElementById('btnStartPause').addEventListener('click', () => {
            this.running = !this.running;
            document.getElementById('btnStartPause').textContent =
                this.running ? 'Pause' : 'Start';
        });

        // Next Generation button
        document.getElementById('btnNextGen').addEventListener('click', () => {
            this.#nextGeneration(false);
        });

        // New Maze button
        document.getElementById('btnNewMaze').addEventListener('click', () => {
            this.#nextGeneration(true);
        });

        // Reset button
        document.getElementById('btnReset').addEventListener('click', () => {
            this.ga = new GeneticAlgorithm({
                populationSize: this.config.populationSize,
                eliteCount: 5,
                mutationRate: 0.2,
                mutationAmount: 0.3
            });
            this.maze.generate();
            this.#initPopulation();
            document.getElementById('generation').textContent = '0';
        });

        // Save Brain button
        document.getElementById('btnSave').addEventListener('click', () => {
            if (this.bestAgent) {
                this.ga.saveBrain(this.bestAgent.brain);
                alert('Best brain saved to localStorage!');
            }
        });

        // Load Brain button
        document.getElementById('btnLoad').addEventListener('click', () => {
            const brain = this.ga.loadBrain();
            if (brain) {
                // Create population with loaded brain as seed
                const brains = [];
                for (let i = 0; i < this.config.populationSize; i++) {
                    const cloned = NeuralNetwork.clone(brain);
                    if (i > 0) {
                        // Mutate all but the first (elite)
                        NeuralNetwork.mutate(cloned, 0.1);
                    }
                    brains.push(cloned);
                }
                this.#initPopulation(brains);
                alert('Brain loaded! Population seeded with saved brain.');
            } else {
                alert('No saved brain found!');
            }
        });

        // Clear Brain button
        document.getElementById('btnClear').addEventListener('click', () => {
            if (confirm('Clear saved brain from localStorage?')) {
                this.ga.clearBrain();
                alert('Saved brain cleared!');
            }
        });

        // Show Sensors toggle
        document.getElementById('chkSensors').addEventListener('change', (e) => {
            this.config.showSensors = e.target.checked;
        });

        // Show Only Best toggle
        document.getElementById('chkOnlyBest').addEventListener('change', (e) => {
            this.config.showOnlyBest = e.target.checked;
        });

        // Auto Evolve toggle
        document.getElementById('chkAutoEvolve').addEventListener('change', (e) => {
            this.config.autoEvolve = e.target.checked;
        });

        // Speed slider
        document.getElementById('speedSlider').addEventListener('input', (e) => {
            this.config.simulationSpeed = parseInt(e.target.value);
            document.getElementById('speedValue').textContent = e.target.value + 'x';
        });

        // Maze size controls
        document.getElementById('mazeCols').addEventListener('change', (e) => {
            this.config.mazeCols = parseInt(e.target.value);
        });
        document.getElementById('mazeRows').addEventListener('change', (e) => {
            this.config.mazeRows = parseInt(e.target.value);
        });

        // Apply Maze Size button
        document.getElementById('btnApplySize').addEventListener('click', () => {
            this.config.mazeCols = parseInt(document.getElementById('mazeCols').value);
            this.config.mazeRows = parseInt(document.getElementById('mazeRows').value);
            this.#updateCanvasSize();
            this.maze = new Maze(
                this.config.mazeCols,
                this.config.mazeRows,
                this.config.cellSize
            );
            // Keep current brains but reset agents for new maze
            const brains = this.agents.map(a => a.brain);
            this.#initPopulation(brains);
        });

        // Population size
        document.getElementById('popSize').addEventListener('change', (e) => {
            this.config.populationSize = parseInt(e.target.value);
            this.ga.populationSize = this.config.populationSize;
        });

        // Max time slider
        document.getElementById('maxTime').addEventListener('input', (e) => {
            this.config.maxGenerationTime = parseInt(e.target.value);
            document.getElementById('maxTimeValue').textContent = e.target.value;
        });

        // Update saved brain indicator
        const hasSaved = this.ga.hasSavedBrain();
        document.getElementById('savedIndicator').textContent =
            hasSaved ? '✓ Brain saved' : 'No saved brain';
    }

    // Public method to start
    start() {
        this.running = true;
        document.getElementById('btnStartPause').textContent = 'Pause';
    }
}

// Initialize simulation when page loads
let simulation;
window.addEventListener('load', () => {
    simulation = new Simulation();
});