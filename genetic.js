/**
 * Genetic Algorithm Module
 * Handles selection, crossover, mutation, and population management
 */

class GeneticAlgorithm {
    constructor(config = {}) {
        this.populationSize = config.populationSize || 100;
        this.eliteCount = config.eliteCount || 5;
        this.mutationRate = config.mutationRate || 0.2;
        this.mutationAmount = config.mutationAmount || 0.3;
        this.crossoverRate = config.crossoverRate || 0.5;

        // Statistics
        this.generation = 0;
        this.bestFitness = 0;
        this.avgFitness = 0;
        this.goalsReached = 0;
        this.history = [];
    }

    /**
     * Create next generation from current population
     * @param {Agent[]} agents - Current population
     * @returns {NeuralNetwork[]} - Brains for next generation
     */
    evolve(agents) {
        this.generation++;

        // Calculate fitness and sort
        const ranked = agents
            .map(agent => ({
                brain: agent.brain,
                fitness: agent.getFitness(),
                reachedGoal: agent.reachedGoal
            }))
            .sort((a, b) => b.fitness - a.fitness);

        // Update statistics
        this.bestFitness = ranked[0].fitness;
        this.avgFitness = ranked.reduce((sum, a) => sum + a.fitness, 0) / ranked.length;
        this.goalsReached = ranked.filter(a => a.reachedGoal).length;

        this.history.push({
            generation: this.generation,
            bestFitness: this.bestFitness,
            avgFitness: this.avgFitness,
            goalsReached: this.goalsReached
        });

        // Create new population
        const newBrains = [];

        // Elitism: keep top performers unchanged
        for (let i = 0; i < this.eliteCount && i < ranked.length; i++) {
            newBrains.push(NeuralNetwork.clone(ranked[i].brain));
        }

        // Fill rest with selection + crossover + mutation
        // Only top 30% can breed
        const poolSize = Math.max(10, Math.floor(ranked.length * CONFIG.ga.breedingPoolPercent));
        const breedingPool = ranked.slice(0, poolSize);

        // Fill rest with selection + crossover + mutation
        while (newBrains.length < this.populationSize) {
            if (Math.random() < this.crossoverRate && ranked.length >= 2) {
                // Crossover - you already fixed this part
                const parent1 = this.#selectParent(breedingPool);
                const parent2 = this.#selectParent(breedingPool);
                const child = NeuralNetwork.crossover(parent1.brain, parent2.brain);
                NeuralNetwork.mutate(child, this.#getVariableMutation());
                newBrains.push(child);
            } else {
                // Single parent mutation - THIS is the else branch
                const parent = this.#selectParent(breedingPool);
                const child = NeuralNetwork.clone(parent.brain);
                NeuralNetwork.mutate(child, this.#getVariableMutation());
                newBrains.push(child);
            }
        }

        return newBrains;
    }

    /**
     * Tournament selection
     */
    #selectParent(ranked) {
        // Exponential rank selection - heavily favors top performers
        const rank = Math.floor(Math.pow(Math.random(), 2) * ranked.length);
        return ranked[rank];
    }

    /**
     * Variable mutation rate for diversity
     */
    #getVariableMutation() {
        // Adapt based on progress
        const stagnant = this.history.length > 10 &&
            this.history.slice(-10).every(h => h.goalsReached === 0);

        if (stagnant) {
            // Population stuck - increase exploration
            return this.mutationAmount * (1.5 + Math.random());
        }

        // Normal variable mutation
        if (Math.random() < 0.1) {
            return this.mutationAmount * 2;
        } else if (Math.random() < 0.3) {
            return this.mutationAmount * 0.3;
        }
        return this.mutationAmount;
    }

    /**
     * Get the best brain from population
     */
    getBestBrain(agents) {
        let best = agents[0];
        for (const agent of agents) {
            if (agent.getFitness() > best.getFitness()) {
                best = agent;
            }
        }
        return NeuralNetwork.clone(best.brain);
    }

    /**
     * Save best brain to localStorage
     */
    saveBrain(brain, key = 'mazeBrain') {
        const data = JSON.stringify(brain);
        localStorage.setItem(key, data);
        console.log(`Brain saved to localStorage['${key}']`);
    }

    /**
     * Load brain from localStorage
     */
    loadBrain(key = 'mazeBrain') {
        const data = localStorage.getItem(key);
        if (!data) {
            console.log(`No brain found in localStorage['${key}']`);
            return null;
        }

        const parsed = JSON.parse(data);
        const brain = new NeuralNetwork([1]); // Dummy init
        brain.levels = parsed.levels.map(levelData => {
            const level = new Level(levelData.inputs.length, levelData.outputs.length);
            level.biases = levelData.biases;
            level.weights = levelData.weights;
            return level;
        });

        console.log(`Brain loaded from localStorage['${key}']`);
        return brain;
    }

    /**
     * Check if saved brain exists
     */
    hasSavedBrain(key = 'mazeBrain') {
        return localStorage.getItem(key) !== null;
    }

    /**
     * Clear saved brain
     */
    clearBrain(key = 'mazeBrain') {
        localStorage.removeItem(key);
        console.log(`Brain cleared from localStorage['${key}']`);
    }

    /**
     * Get statistics string
     */
    getStats() {
        return {
            generation: this.generation,
            bestFitness: this.bestFitness.toFixed(2),
            avgFitness: this.avgFitness.toFixed(2),
            goalsReached: this.goalsReached,
            populationSize: this.populationSize
        };
    }
}