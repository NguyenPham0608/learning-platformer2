// network.js
class NeuralNetwork {
    constructor(inputNodes, hiddenNodes, outputNodes) {
        this.inputNodes = inputNodes;
        this.hiddenNodes = hiddenNodes;
        this.outputNodes = outputNodes;

        // Weights and biases
        this.weightsIH = new Array(this.hiddenNodes);
        this.weightsHO = new Array(this.outputNodes);
        this.biasH = new Array(this.hiddenNodes);
        this.biasO = new Array(this.outputNodes);

        for (let i = 0; i < this.hiddenNodes; i++) {
            this.weightsIH[i] = new Array(this.inputNodes);
            for (let j = 0; j < this.inputNodes; j++) {
                this.weightsIH[i][j] = Math.random() * 2 - 1;
            }
            this.biasH[i] = Math.random() * 2 - 1;
        }

        for (let i = 0; i < this.outputNodes; i++) {
            this.weightsHO[i] = new Array(this.hiddenNodes);
            for (let j = 0; j < this.hiddenNodes; j++) {
                this.weightsHO[i][j] = Math.random() * 2 - 1;
            }
            this.biasO[i] = Math.random() * 2 - 1;
        }
    }

    forward(inputs) {
        // Hidden layer
        let hidden = new Array(this.hiddenNodes);
        for (let i = 0; i < this.hiddenNodes; i++) {
            let sum = 0;
            for (let j = 0; j < this.inputNodes; j++) {
                sum += inputs[j] * this.weightsIH[i][j];
            }
            sum += this.biasH[i];
            hidden[i] = Math.tanh(sum);
        }

        // Output layer
        let outputs = new Array(this.outputNodes);
        for (let i = 0; i < this.outputNodes; i++) {
            let sum = 0;
            for (let j = 0; j < this.hiddenNodes; j++) {
                sum += hidden[j] * this.weightsHO[i][j];
            }
            sum += this.biasO[i];
            outputs[i] = 1 / (1 + Math.exp(-sum)); // sigmoid
        }

        return outputs;
    }

    clone() {
        let nn = new NeuralNetwork(this.inputNodes, this.hiddenNodes, this.outputNodes);
        for (let i = 0; i < this.hiddenNodes; i++) {
            for (let j = 0; j < this.inputNodes; j++) {
                nn.weightsIH[i][j] = this.weightsIH[i][j];
            }
            nn.biasH[i] = this.biasH[i];
        }
        for (let i = 0; i < this.outputNodes; i++) {
            for (let j = 0; j < this.hiddenNodes; j++) {
                nn.weightsHO[i][j] = this.weightsHO[i][j];
            }
            nn.biasO[i] = this.biasO[i];
        }
        return nn;
    }

    mutate(mutationRate, mutationStrength) {
        const mutateValue = (val) => {
            if (Math.random() < mutationRate) {
                return val + getRandomGaussian() * mutationStrength;
            }
            return val;
        };

        for (let i = 0; i < this.hiddenNodes; i++) {
            for (let j = 0; j < this.inputNodes; j++) {
                this.weightsIH[i][j] = mutateValue(this.weightsIH[i][j]);
            }
            this.biasH[i] = mutateValue(this.biasH[i]);
        }
        for (let i = 0; i < this.outputNodes; i++) {
            for (let j = 0; j < this.hiddenNodes; j++) {
                this.weightsHO[i][j] = mutateValue(this.weightsHO[i][j]);
            }
            this.biasO[i] = mutateValue(this.biasO[i]);
        }
    }
}