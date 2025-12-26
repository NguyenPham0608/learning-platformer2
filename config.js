/**
 * Global Configuration - Tweak these from the console!
 * Access via: CONFIG.culling.earlyDeathFrame = 200
 */

const CONFIG = {
    // === CULLING PARAMETERS ===
    culling: {
        earlyDeathFrame: 80,              // Kill non-starters earlier
        earlyDeathMinDistance: 0.3,       // Lower threshold - just need SOME movement
        stationaryDeathTime: 120,         // Kill stuck agents faster
        stationaryThreshold: 0.15,        // Slightly more lenient
    },

    // === FITNESS REWARDS ===
    fitness: {
        // Goal rewards
        goalBaseReward: 100000,         // Base reward for reaching goal
        goalSpeedBonus: 50000,          // Divided by age for speed bonus

        // Exploration rewards
        checkpointReward: 100,          // Per unique cell visited
        progressMultiplier: 500,        // Multiplied by progress percentage
        survivalReward: 0.3,            // Per frame alive (if moved from start)

        // Minimum fitness floor
        minFitness: 0.0001,
    },

    // === FITNESS PENALTIES ===
    penalties: {
        // Spinning penalty
        spinRatioThreshold: 1,          // rotation/distance ratio threshold
        spinPenaltyFactor: 0.5,         // Fitness multiplied by (this / spinRatio)

        // Non-mover penalty
        nonMoverAgeCutoff: 100,         // Age after which non-movers are penalized
        nonMoverPenalty: 0.1,           // Fitness multiplied by this
    },

    // === AGENT PHYSICS ===
    physics: {
        maxSpeed: 2,
        acceleration: 0.15,
        friction: 0.98,
        rotationSpeed: 0.08,
        angularFriction: 0.85,
        size: 12,
    },

    // === SENSOR SETTINGS ===
    sensors: {
        rayCount: 16,
        rayLength: 150,
    },

    // === GENETIC ALGORITHM ===
    ga: {
        eliteCount: 5,
        mutationRate: 0.3,
        mutationAmount: 0.3,
        crossoverRate: 0.5,
        breedingPoolPercent: 0.3,       // Top X% can breed
        tournamentSize: 5,
    },

    // === NEURAL NETWORK ===
    network: {
        hiddenLayers: [16, 12],
    },
};

// Helper to print current config
CONFIG.print = function (section) {
    if (section && this[section]) {
        console.table(this[section]);
    } else {
        console.log('=== CONFIG ===');
        for (const key of Object.keys(this)) {
            if (typeof this[key] === 'object' && key !== 'print') {
                console.log(`\n[${key}]`);
                console.table(this[key]);
            }
        }
    }
};

// Helper to reset to defaults (store originals)
CONFIG._defaults = JSON.parse(JSON.stringify(CONFIG));
CONFIG.reset = function (section) {
    if (section && this._defaults[section]) {
        this[section] = JSON.parse(JSON.stringify(this._defaults[section]));
        console.log(`Reset CONFIG.${section} to defaults`);
    } else {
        console.log('Usage: CONFIG.reset("culling") or CONFIG.reset("fitness")');
    }
};