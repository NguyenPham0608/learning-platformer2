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
        let paired = this.population.map((brain, index) => ({ brain, fitness: fitnesses[index] }));
        paired.sort((a, b) => b.fitness - a.fitness);

        const eliteCount = Math.floor(this.popSize * 0.1);
        let newPopulation = paired.slice(0, eliteCount).map(p => p.brain.clone());

        // Add some completely random brains for exploration
        const randomCount = Math.floor(this.popSize * 0.1);
        for (let i = 0; i < randomCount; i++) {
            newPopulation.push(new NeuralNetwork(
                paired[0].brain.inputNodes,
                paired[0].brain.hiddenNodes,
                paired[0].brain.outputNodes
            ));
        }

        // Fill rest with mutated elites
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