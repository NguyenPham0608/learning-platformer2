/**
 * Config UI - Generates sliders for all CONFIG parameters
 */

const ConfigUI = {
    // Define slider ranges and steps for each parameter
    sliderDefs: {
        culling: {
            earlyDeathFrame: { min: 50, max: 300, step: 10, label: 'Early Death Frame' },
            earlyDeathMinDistance: { min: 0, max: 1, step: 0.05, label: 'Early Death Min Dist (×cellSize)' },
            stationaryDeathTime: { min: 50, max: 500, step: 25, label: 'Stationary Death Time' },
            stationaryThreshold: { min: 0.05, max: 0.5, step: 0.05, label: 'Stationary Threshold' },
        },
        fitness: {
            goalBaseReward: { min: 10000, max: 200000, step: 10000, label: 'Goal Base Reward' },
            goalSpeedBonus: { min: 10000, max: 100000, step: 5000, label: 'Goal Speed Bonus' },
            checkpointReward: { min: 10, max: 300, step: 10, label: 'Checkpoint Reward' },
            progressMultiplier: { min: 100, max: 1000, step: 50, label: 'Progress Multiplier' },
            survivalReward: { min: 0, max: 2, step: 0.1, label: 'Survival Reward/Frame' },
            minFitness: { min: 0.0001, max: 0.1, step: 0.001, label: 'Min Fitness Floor' },
        },
        penalties: {
            spinRatioThreshold: { min: 0.5, max: 3, step: 0.1, label: 'Spin Ratio Threshold' },
            spinPenaltyFactor: { min: 0.1, max: 1, step: 0.05, label: 'Spin Penalty Factor' },
            nonMoverAgeCutoff: { min: 50, max: 200, step: 10, label: 'Non-Mover Age Cutoff' },
            nonMoverPenalty: { min: 0.01, max: 0.5, step: 0.01, label: 'Non-Mover Penalty' },
        },
        physics: {
            maxSpeed: { min: 1, max: 5, step: 0.25, label: 'Max Speed' },
            acceleration: { min: 0.05, max: 0.5, step: 0.05, label: 'Acceleration' },
            friction: { min: 0.9, max: 1, step: 0.01, label: 'Friction' },
            rotationSpeed: { min: 0.02, max: 0.2, step: 0.01, label: 'Rotation Speed' },
            angularFriction: { min: 0.7, max: 0.95, step: 0.05, label: 'Angular Friction' },
            size: { min: 6, max: 20, step: 1, label: 'Agent Size' },
        },
        sensors: {
            rayCount: { min: 8, max: 180, step: 4, label: 'Ray Count' },
            rayLength: { min: 50, max: 400, step: 25, label: 'Ray Length' },
        },
        ga: {
            eliteCount: { min: 1, max: 20, step: 1, label: 'Elite Count' },
            championOffspring: { min: 0, max: 400, step: 10, label: 'Champion Offspring' },
            championMutationAmount: { min: 0.05, max: 0.5, step: 0.05, label: 'Champion Mutation' },
            mutationRate: { min: 0.05, max: 0.8, step: 0.05, label: 'Mutation Rate' },
            mutationAmount: { min: 0.05, max: 0.8, step: 0.05, label: 'Mutation Amount' },
            crossoverRate: { min: 0.1, max: 0.9, step: 0.1, label: 'Crossover Rate' },
            breedingPoolPercent: { min: 0.1, max: 0.6, step: 0.05, label: 'Breeding Pool %' },
            tournamentSize: { min: 2, max: 10, step: 1, label: 'Tournament Size' },
        },
    },

    // Track which sections are collapsed
    collapsed: {
        culling: false,
        fitness: true,
        penalties: true,
        physics: true,
        sensors: true,
        ga: true,
    },

    init() {
        this.container = document.getElementById('configSliders');
        if (!this.container) {
            console.warn('Config UI container not found');
            return;
        }
        this.render();
    },

    render() {
        this.container.innerHTML = '';

        for (const [section, params] of Object.entries(this.sliderDefs)) {
            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'config-section';

            // Section header (clickable to collapse)
            const header = document.createElement('div');
            header.className = 'config-section-header';
            header.innerHTML = `
                <span class="collapse-icon">${this.collapsed[section] ? '▶' : '▼'}</span>
                <span>${this.formatSectionName(section)}</span>
                <button class="reset-btn" data-section="${section}">↺</button>
            `;
            header.addEventListener('click', (e) => {
                if (e.target.classList.contains('reset-btn')) {
                    this.resetSection(section);
                    return;
                }
                this.collapsed[section] = !this.collapsed[section];
                this.render();
            });
            sectionDiv.appendChild(header);

            // Section content
            const content = document.createElement('div');
            content.className = 'config-section-content';
            content.style.display = this.collapsed[section] ? 'none' : 'block';

            for (const [param, def] of Object.entries(params)) {
                const value = CONFIG[section][param];
                const sliderId = `config-${section}-${param}`;

                const sliderDiv = document.createElement('div');
                sliderDiv.className = 'config-slider';
                sliderDiv.innerHTML = `
                    <label>
                        <span class="config-label">${def.label}</span>
                        <span class="config-value" id="${sliderId}-value">${this.formatValue(value)}</span>
                    </label>
                    <input type="range" 
                        id="${sliderId}"
                        min="${def.min}" 
                        max="${def.max}" 
                        step="${def.step}" 
                        value="${value}"
                        data-section="${section}"
                        data-param="${param}">
                `;
                content.appendChild(sliderDiv);

                // Add event listener after appending
                const slider = sliderDiv.querySelector('input');
                slider.addEventListener('input', (e) => this.onSliderChange(e));
            }

            sectionDiv.appendChild(content);
            this.container.appendChild(sectionDiv);
        }
    },

    onSliderChange(e) {
        const section = e.target.dataset.section;
        const param = e.target.dataset.param;
        let value = parseFloat(e.target.value);

        // Update CONFIG
        CONFIG[section][param] = value;

        // Update display
        const valueDisplay = document.getElementById(`${e.target.id}-value`);
        if (valueDisplay) {
            valueDisplay.textContent = this.formatValue(value);
        }

        // Update GA instance if it exists and relevant
        if (section === 'ga' && window.simulation && simulation.ga) {
            if (param === 'eliteCount') simulation.ga.eliteCount = value;
            if (param === 'mutationRate') simulation.ga.mutationRate = value;
            if (param === 'mutationAmount') simulation.ga.mutationAmount = value;
            if (param === 'crossoverRate') simulation.ga.crossoverRate = value;
        }
    },

    resetSection(section) {
        if (CONFIG._defaults && CONFIG._defaults[section]) {
            CONFIG[section] = JSON.parse(JSON.stringify(CONFIG._defaults[section]));
            this.render();
            console.log(`Reset CONFIG.${section} to defaults`);
        }
    },

    formatSectionName(name) {
        return name.charAt(0).toUpperCase() + name.slice(1);
    },

    formatValue(val) {
        if (val >= 1000) return val.toLocaleString();
        if (Number.isInteger(val)) return val.toString();
        if (val < 0.01) return val.toFixed(4);
        if (val < 1) return val.toFixed(2);
        return val.toFixed(2);
    },

    // Refresh sliders to match current CONFIG values
    refresh() {
        for (const [section, params] of Object.entries(this.sliderDefs)) {
            for (const param of Object.keys(params)) {
                const sliderId = `config-${section}-${param}`;
                const slider = document.getElementById(sliderId);
                const valueDisplay = document.getElementById(`${sliderId}-value`);
                if (slider && CONFIG[section]) {
                    slider.value = CONFIG[section][param];
                    if (valueDisplay) {
                        valueDisplay.textContent = this.formatValue(CONFIG[section][param]);
                    }
                }
            }
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    ConfigUI.init();
});
