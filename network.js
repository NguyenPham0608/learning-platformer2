/**
 * Neural Network Module
 * Feed-forward network for neuroevolution (no backpropagation)
 */

class NeuralNetwork {
    constructor(neuronCounts) {
        this.levels = [];
        for (let i = 0; i < neuronCounts.length - 1; i++) {
            this.levels.push(new Level(neuronCounts[i], neuronCounts[i + 1]));
        }
    }

    static feedForward(givenInputs, network) {
        let outputs = Level.feedForward(givenInputs, network.levels[0]);
        for (let i = 1; i < network.levels.length; i++) {
            outputs = Level.feedForward(outputs, network.levels[i]);
        }
        return outputs;
    }

    static mutate(network, amount = 0.1) {
        network.levels.forEach(level => {
            for (let i = 0; i < level.biases.length; i++) {
                level.biases[i] = lerp(
                    level.biases[i],
                    Math.random() * 2 - 1,
                    amount
                );
            }
            for (let i = 0; i < level.weights.length; i++) {
                for (let j = 0; j < level.weights[i].length; j++) {
                    level.weights[i][j] = lerp(
                        level.weights[i][j],
                        Math.random() * 2 - 1,
                        amount
                    );
                }
            }
        });
    }

    static clone(network) {
        const clone = new NeuralNetwork([1]); // Dummy init
        clone.levels = network.levels.map(level => Level.clone(level));
        return clone;
    }

    static crossover(parent1, parent2) {
        const child = NeuralNetwork.clone(parent1);
        for (let l = 0; l < child.levels.length; l++) {
            const level = child.levels[l];
            const p2Level = parent2.levels[l];

            // Crossover biases
            for (let i = 0; i < level.biases.length; i++) {
                if (Math.random() < 0.5) {
                    level.biases[i] = p2Level.biases[i];
                }
            }

            // Crossover weights
            for (let i = 0; i < level.weights.length; i++) {
                for (let j = 0; j < level.weights[i].length; j++) {
                    if (Math.random() < 0.5) {
                        level.weights[i][j] = p2Level.weights[i][j];
                    }
                }
            }
        }
        return child;
    }
}

class Level {
    constructor(inputCount, outputCount) {
        this.inputs = new Array(inputCount);
        this.outputs = new Array(outputCount);
        this.biases = new Array(outputCount);
        this.weights = [];

        for (let i = 0; i < inputCount; i++) {
            this.weights[i] = new Array(outputCount);
        }

        Level.#randomize(this);
    }

    static #randomize(level) {
        for (let i = 0; i < level.inputs.length; i++) {
            for (let j = 0; j < level.outputs.length; j++) {
                level.weights[i][j] = Math.random() * 2 - 1;
            }
        }
        for (let i = 0; i < level.biases.length; i++) {
            level.biases[i] = Math.random() * 2 - 1;
        }
    }

    static feedForward(givenInputs, level) {
        for (let i = 0; i < level.inputs.length; i++) {
            level.inputs[i] = givenInputs[i];
        }

        for (let i = 0; i < level.outputs.length; i++) {
            let sum = 0;
            for (let j = 0; j < level.inputs.length; j++) {
                sum += level.inputs[j] * level.weights[j][i];
            }
            // Using tanh activation for smoother outputs
            level.outputs[i] = Math.tanh(sum + level.biases[i]);
        }

        return level.outputs;
    }

    static clone(level) {
        const clone = new Level(level.inputs.length, level.outputs.length);
        clone.biases = [...level.biases];
        clone.weights = level.weights.map(row => [...row]);
        return clone;
    }
}

// Linear interpolation helper
function lerp(a, b, t) {
    return a + (b - a) * t;
}