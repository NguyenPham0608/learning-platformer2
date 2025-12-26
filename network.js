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

    static draw(ctx, network, inputs = null) {
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        const padding = 30;

        // Clear
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, width, height);

        // Calculate layer sizes
        const layers = [network.levels[0].inputs.length];
        for (const level of network.levels) {
            layers.push(level.outputs.length);
        }

        const layerCount = layers.length;
        const layerSpacing = (width - padding * 2) / (layerCount - 1);

        // Calculate neuron positions
        const positions = [];
        for (let l = 0; l < layerCount; l++) {
            const neuronCount = layers[l];
            const x = padding + l * layerSpacing;
            const maxVisible = 20; // Cap visible neurons per layer
            const displayCount = Math.min(neuronCount, maxVisible);
            const neuronSpacing = (height - padding * 2) / (displayCount + 1);

            positions[l] = [];
            for (let n = 0; n < displayCount; n++) {
                const y = padding + (n + 1) * neuronSpacing;
                positions[l].push({ x, y, index: n });
            }

            // Add "..." indicator if truncated
            if (neuronCount > maxVisible) {
                positions[l].push({ x, y: height - padding / 2, truncated: true, total: neuronCount });
            }
        }

        // Draw connections (weights)
        for (let l = 0; l < network.levels.length; l++) {
            const level = network.levels[l];
            const fromPos = positions[l].filter(p => !p.truncated);
            const toPos = positions[l + 1].filter(p => !p.truncated);

            for (let i = 0; i < fromPos.length; i++) {
                for (let j = 0; j < toPos.length; j++) {
                    if (i < level.weights.length && j < level.weights[i].length) {
                        const weight = level.weights[i][j];
                        const alpha = Math.min(Math.abs(weight) * 0.5, 0.8);

                        if (weight > 0) {
                            ctx.strokeStyle = `rgba(100, 200, 255, ${alpha})`;
                        } else {
                            ctx.strokeStyle = `rgba(255, 100, 100, ${alpha})`;
                        }

                        ctx.lineWidth = Math.abs(weight) * 1.5;
                        ctx.beginPath();
                        ctx.moveTo(fromPos[i].x, fromPos[i].y);
                        ctx.lineTo(toPos[j].x, toPos[j].y);
                        ctx.stroke();
                    }
                }
            }
        }

        // Draw neurons
        for (let l = 0; l < layerCount; l++) {
            for (const pos of positions[l]) {
                if (pos.truncated) {
                    // Draw "..." indicator
                    ctx.fillStyle = '#666';
                    ctx.font = '10px monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText(`...${pos.total} total`, pos.x, pos.y);
                    continue;
                }

                let activation = 0;
                if (l === 0 && inputs && pos.index < inputs.length) {
                    activation = inputs[pos.index];
                } else if (l > 0 && network.levels[l - 1]) {
                    const outputs = network.levels[l - 1].outputs;
                    if (pos.index < outputs.length) {
                        activation = outputs[pos.index];
                    }
                }

                // Color based on activation
                const r = activation < 0 ? Math.floor(-activation * 200) : 0;
                const g = activation > 0 ? Math.floor(activation * 200) : 0;
                const b = 100;

                ctx.fillStyle = `rgb(${50 + r}, ${50 + g}, ${100 + b})`;
                ctx.strokeStyle = '#4af';
                ctx.lineWidth = 1;

                ctx.beginPath();
                ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }
        }

        // Draw layer labels
        ctx.fillStyle = '#666';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        const labels = ['Input', ...network.levels.map((_, i) => i === network.levels.length - 1 ? 'Output' : `Hidden ${i + 1}`)];
        for (let l = 0; l < layerCount; l++) {
            const x = padding + l * layerSpacing;
            ctx.fillText(labels[l], x, 15);
            ctx.fillText(`(${layers[l]})`, x, height - 5);
        }
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