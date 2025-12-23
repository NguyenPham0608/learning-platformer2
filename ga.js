// ga.js
class GeneticAlgorithm {
    constructor(popSize, inputNodes, hiddenNodes, outputNodes, mutationRate = 0.5, mutationStrength = 0.4) {
        this.popSize = popSize;
        this.mutationRate = mutationRate;
        this.mutationStrength = mutationStrength;
        this.population = [];
        for (let i = 0; i < popSize; i++) {
            this.population.push(new NeuralNetwork(inputNodes, hiddenNodes, outputNodes));
        }
        this.generation = 0;
    }

    nextGeneration(fitnesses) {
        // Pair brains with fitness
        let paired = this.population.map((brain, index) => ({ brain, fitness: fitnesses[index] }));
        paired.sort((a, b) => b.fitness - a.fitness);

        // Elitism: keep top 20%
        const eliteCount = Math.floor(this.popSize * 0.2);
        let newPopulation = paired.slice(0, eliteCount).map(p => p.brain.clone());

        // Fill the rest with mutated clones from elite
        while (newPopulation.length < this.popSize) {
            const parentIndex = Math.floor(Math.random() * eliteCount);
            const child = paired[parentIndex].brain.clone();
            child.mutate(this.mutationRate, this.mutationStrength);
            newPopulation.push(child);
        }

        this.population = newPopulation;
        this.generation++;
    }

    getBestBrain() {
        // Assuming we have a way to track best, but for simplicity, return the first after sorting in nextGen
        return this.population[0]; // After sorting, elites are at front
    }
}