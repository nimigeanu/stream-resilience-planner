// Default values and configuration
const DEFAULT_STATE = {
    audience: 10000,
    stakes: 'medium',
    outage: '1to5',
    environment: 'hostile',
    appetite: 'practical',
    badminute: 1000,
    events: 25,
};

const TIERS = ['no-backup', 'restart', 'fire-exit', 'mirrored', 'active-active'];
const TIER_ORDER = {
    'no-backup': 0,
    'restart': 1,
    'fire-exit': 2,
    'mirrored': 3,
    'active-active': 4,
};

const TIER_INFO = {
    'no-backup': {
        name: 'No real backup',
        desc: 'Cheap until it is not.',
        cost: 0,
        coverage: 0,
        recovery: 30,
    },
    'restart': {
        name: 'Restart-and-recover',
        desc: 'Basic recovery, not true failover.',
        cost: 1500,
        coverage: 0.25,
        recovery: 5,
    },
    'fire-exit': {
        name: 'Fire-exit backup',
        desc: 'A deliberately degraded but independent backup path.',
        cost: 9000,
        coverage: 0.65,
        recovery: 1,
    },
    'mirrored': {
        name: 'Mirrored backup',
        desc: 'A more complete duplicate path.',
        cost: 42000,
        coverage: 0.8,
        recovery: 0.5,
    },
    'active-active': {
        name: 'Full active-active',
        desc: 'The bunker.',
        cost: 120000,
        coverage: 0.92,
        recovery: 0.167,
    },
};

const badMinuteSteps = [10, 100, 1000, 10000, 100000];
const eventSteps = [1, 5, 25, 100, 500];
const audienceSteps = [100, 1000, 10000, 100000, 1000000];
const stakeSteps = ['low', 'medium', 'high', 'critical'];
const outageSteps = ['5plus', '1to5', '30to60', 'nearzero'];
const environmentSteps = ['controlled', 'normal', 'hostile', 'chaotic'];
const appetiteSteps = ['lean', 'practical', 'premium', 'nocompromise'];
const stakeComments = {
    low: 'Internal / community / nice-to-have',
    medium: 'Webinar / marketing / customer-facing',
    high: 'Paid event / product launch / enterprise',
    critical: 'Sports / betting / auction / finance / emergency comms',
};
const outageComments = {
    '5plus': 'Survivable',
    '1to5': 'Hurts',
    '30to60': 'Max',
    nearzero: 'Interruption',
};
const environmentComments = {
    controlled: 'Studio, stable network, repeatable setup',
    normal: 'Office/event venue, standard internet',
    hostile: 'Temporary venue, cellular/satellite, travel crew',
    chaotic: 'Outdoor, remote, live switching, unknown network',
};
const appetiteComments = {
    lean: 'Keep cost tiny',
    practical: 'Spend where it reduces failures',
    premium: 'Protect the brand/event strongly',
    nocompromise: 'Continuity is worth serious spend',
};

function updateStakesComment(stake) {
    const comment = document.getElementById('stakes-comment');
    if (comment) {
        comment.textContent = stakeComments[stake] || '';
    }
}

function updateOutageComment(outage) {
    const comment = document.getElementById('outage-comment');
    if (comment) comment.textContent = outageComments[outage] || '';
}

function updateEnvironmentComment(environment) {
    const comment = document.getElementById('environment-comment');
    if (comment) comment.textContent = environmentComments[environment] || '';
}

function updateAppetiteComment(appetite) {
    const comment = document.getElementById('appetite-comment');
    if (comment) comment.textContent = appetiteComments[appetite] || '';
}

function wireDiscreteSlider(sliderId, steps, onValue) {
    const slider = document.getElementById(sliderId);
    if (!slider) return;
    const sliderGroup = slider.closest('.slider-group');

    const updateFromIndex = (idx) => {
        const bounded = Math.max(0, Math.min(steps.length - 1, idx));
        slider.value = String(bounded);
        onValue(steps[bounded]);
        saveState();
        updateAllOutputs();
    };

    const getNearestIndexFromClientX = (clientX) => {
        const rect = slider.getBoundingClientRect();
        const styles = sliderGroup ? getComputedStyle(sliderGroup) : null;
        const thumbSizeRaw = styles ? styles.getPropertyValue('--slider-thumb-size') : '18px';
        const thumbSize = Number.parseFloat(thumbSizeRaw) || 18;
        const usable = Math.max(1, rect.width - thumbSize);
        const x = Math.max(0, Math.min(usable, clientX - rect.left - (thumbSize / 2)));
        const ratio = x / usable;
        return Math.round(ratio * (steps.length - 1));
    };

    slider.addEventListener('input', (e) => {
        const idx = Number(e.target.value);
        onValue(steps[idx]);
        saveState();
        updateAllOutputs();
    });

    if (sliderGroup) {
        sliderGroup.addEventListener('click', (e) => {
            if (e.target === slider) return;
            updateFromIndex(getNearestIndexFromClientX(e.clientX));
        });
    }
}

const BUILD_STEPS = {
    'no-backup': [
        'Keep expectations low',
        'Have an apology/comms plan',
        'Record locally if possible',
        'Make restart access available',
        'Treat this as a deliberate risk acceptance, not resilience',
    ],
    'restart': [
        'Documented restart procedure',
        'Operator access confirmed before event',
        'Basic stream health checks',
        'Clear viewer communication plan',
        'Fast VOD recovery if live fails',
    ],
    'fire-exit': [
        'Backup encoder or alternate contribution path',
        'Separate ingest endpoint',
        'Lower-bitrate emergency ladder',
        'Separate CDN or delivery route if stakes justify it',
        'Pre-tested switch procedure',
        'Viewer-health monitoring',
        'Named human decision owner',
    ],
    'mirrored': [
        'Backup encoder',
        'Backup ingest',
        'Backup origin path',
        'Alternate CDN or delivery route',
        'Tested switch mechanism',
        'Dependency review to avoid fake duplication',
    ],
    'active-active': [
        'Multiple active contribution/delivery paths',
        'Multi-origin or multi-region architecture',
        'Multi-CDN routing',
        'Automated or player-side failover',
        'Real-user playback monitoring',
        'Rehearsed incident command process',
    ],
};

// State management
let state = { ...DEFAULT_STATE };
const STORAGE_KEY = 'redundancy-calc-state';

// Load state from localStorage
function loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        state = { ...DEFAULT_STATE, ...JSON.parse(saved) };
    }
}

// Save state to localStorage
function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Calculation functions
function getBaseIncidentProbability(environment) {
    const probs = {
        controlled: 0.02,
        normal: 0.05,
        hostile: 0.1,
        chaotic: 0.18,
    };
    return probs[environment] || 0.05;
}

function getStakesMultiplier(stakes) {
    const multipliers = {
        low: 0.8,
        medium: 1.0,
        high: 1.25,
        critical: 1.5,
    };
    return multipliers[stakes] || 1.0;
}

function getAudienceMultiplier(audience) {
    const multipliers = {
        100: 0.8,
        1000: 1.0,
        10000: 1.15,
        100000: 1.35,
        1000000: 1.6,
    };
    return multipliers[audience] || 1.0;
}

function getAverageOutageDuration(environment) {
    const durations = {
        controlled: 8,
        normal: 12,
        hostile: 20,
        chaotic: 30,
    };
    return durations[environment] || 12;
}

function calculateIncidentProbability(environment, stakes, audience) {
    const base = getBaseIncidentProbability(environment);
    const stakesM = getStakesMultiplier(stakes);
    const audienceM = getAudienceMultiplier(audience);
    let prob = base * stakesM * audienceM;
    // Clamp to reasonable bounds
    prob = Math.max(0.01, Math.min(0.35, prob));
    return prob;
}

function calculateRemainingBadMinutes(incidentProbability, coverage, environment) {
    const avgOutage = getAverageOutageDuration(environment);
    const remaining = avgOutage * (1 - coverage);
    const tier = getTierByRecoveryInfo(coverage, environment);
    const tierInfo = TIER_INFO[tier];
    const recoveryMin = tierInfo ? tierInfo.recovery : avgOutage;
    return Math.min(remaining, recoveryMin);
}

function getTierByRecoveryInfo(coverage, environment) {
    for (const tier of TIERS) {
        if (TIER_INFO[tier].coverage === coverage) return tier;
    }
    return 'fire-exit';
}

function calculateFailureExposure(incidentProb, badMinutes, badMinuteCost, eventsPerYear) {
    return eventsPerYear * incidentProb * badMinutes * badMinuteCost;
}

function calculateTierCosts(state) {
    const incidentProb = calculateIncidentProbability(state.environment, state.stakes, state.audience);
    const avgOutage = getAverageOutageDuration(state.environment);

    const costs = {};
    for (const tier of TIERS) {
        const tierInfo = TIER_INFO[tier];
        const backupCost = tierInfo.cost;
        const coverage = tierInfo.coverage;

        const badMinutes = coverage === 0
            ? avgOutage
            : Math.min(avgOutage * (1 - coverage), tierInfo.recovery);

        const failureExposure = calculateFailureExposure(
            incidentProb,
            badMinutes,
            state.badminute,
            state.events
        );

        costs[tier] = {
            backup: backupCost,
            failure: failureExposure,
            total: backupCost + failureExposure,
            badMinutes: badMinutes,
            coverage: coverage,
            probability: incidentProb,
        };
    }

    return costs;
}

function findRecommendedTier(costs, state) {
    const allowed = [];

    for (const tier of TIERS) {
        const cost = costs[tier].total;

        // Evaluate constraints
        if (state.outage === 'nearzero' && !['mirrored', 'active-active'].includes(tier)) {
            if (!(state.appetite === 'lean' && ['low', 'medium'].includes(state.stakes))) {
                continue;
            }
        }

        if (state.outage === '1to5' && !['fire-exit', 'mirrored', 'active-active'].includes(tier)) {
            // Lean profiles can accept restart-level continuity if the cost tradeoff is favorable.
            if (!(state.appetite === 'lean' && tier === 'restart')) {
                continue;
            }
        }

        if (state.outage === '30to60' && !['fire-exit', 'mirrored', 'active-active'].includes(tier)) {
            continue;
        }

        if (state.appetite === 'lean' && tier === 'active-active') {
            continue;
        }

        if (state.stakes === 'critical' && tier === 'no-backup') {
            continue;
        }

        allowed.push({ tier, cost });
    }

    if (allowed.length === 0) return 'fire-exit';

    allowed.sort((a, b) => a.cost - b.cost);
    const minCost = allowed[0].cost;
    const appetiteClosePct = state.appetite === 'practical' ? 0.12 : 0.22; // widen for non-neutral appetite
    const closeCostThreshold = minCost * (1 + appetiteClosePct);
    const closeCandidates = allowed.filter(x => x.cost <= closeCostThreshold);

    // Appetite-based tie-break when costs are close
    if (state.appetite === 'lean') {
        return closeCandidates.sort((a, b) => {
            const tierDelta = TIER_ORDER[a.tier] - TIER_ORDER[b.tier];
            if (tierDelta !== 0) return tierDelta;
            return a.cost - b.cost;
        })[0].tier;
    }
    if (state.appetite === 'premium' || state.appetite === 'nocompromise') {
        return closeCandidates.sort((a, b) => {
            const tierDelta = TIER_ORDER[b.tier] - TIER_ORDER[a.tier];
            if (tierDelta !== 0) return tierDelta;
            return a.cost - b.cost;
        })[0].tier;
    }

    // Practical/neutral: choose cheapest.
    return allowed[0].tier;
}

function getRecommendationText(tier, state, costs) {
    const tierInfo = TIER_INFO[tier];
    const cost = costs[tier];

    let why = '';
    let tagline = '';

    if (tier === 'no-backup') {
        why = 'The math says this is cheap. However, your risk profile suggests this is reckless.';
        tagline = 'Doing nothing is also an architecture decision.';
    } else if (tier === 'restart') {
        why = 'Basic recovery can handle low-probability events at manageable cost.';
        tagline = 'Documented procedures can prevent panic.';
    } else if (tier === 'fire-exit') {
        why = 'Your outage exposure is high enough that doing nothing is expensive, but not high enough to justify full active-active. A degraded backup is the efficient middle.';
        tagline = 'Backup becomes cheaper than hoping at: Fire-exit backup.';
    } else if (tier === 'mirrored') {
        why = 'Your event profile justifies the cost of a more complete backup path.';
        tagline = 'The goal of failover is continuity, not symmetry.';
    } else if (tier === 'active-active') {
        why = 'Your stakes and risk profile justify full redundancy and automated failover.';
        tagline = 'Continuity is the architecture.';
    }

    return { why, tagline };
}

function getVerdictForTier(tier, costs, state) {
    const cost = costs[tier];
    const backupCost = cost.backup;
    const failureCost = cost.failure;

    if (tier === 'no-backup') {
        return 'False economy.';
    } else if (tier === 'restart') {
        if (failureCost > backupCost * 5) return 'Could be worse.';
        return 'Basic hedge.';
    } else if (tier === 'fire-exit') {
        if (backupCost < failureCost * 0.5) return 'Efficient middle.';
        if (failureCost === 0) return 'Overkill.';
        return 'Worth it.';
    } else if (tier === 'mirrored') {
        if (cost.total < costs['fire-exit'].total + 5000) return 'Modest upgrade.';
        if (backupCost > failureCost * 2) return 'Overkill.';
        return 'Solid foundation.';
    } else if (tier === 'active-active') {
        if (cost.total > costs['mirrored'].total * 3) return 'Overbuilt for this profile.';
        if (state.stakes === 'critical') return 'Justified.';
        return 'Ultimate safety.';
    }
    return 'Option.';
}

// Formatting helpers
function formatCurrency(value) {
    if (value >= 1000000) {
        return '$' + (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
        return '$' + (value / 1000).toFixed(1) + 'K';
    }
    return '$' + Math.round(value);
}

function formatPercentage(value) {
    return (value * 100).toFixed(0) + '%';
}

// Rendering functions
function renderRecommendation(tier, state, costs) {
    const tierInfo = TIER_INFO[tier];
    const { why } = getRecommendationText(tier, state, costs);

    document.getElementById('rec-tier').textContent = 'Recommended option: ' + tierInfo.name;
    document.getElementById('rec-why').textContent = why;
    document.getElementById('rec-tagline').textContent = '';
}

function renderChart(costs, recommended) {
    const container = document.getElementById('chart-bars');
    container.innerHTML = '';

    const width = Math.floor(container.clientWidth || 760);
    const height = 300;
    const isNarrow = width < 560;
    const margin = isNarrow
        ? { top: 20, right: 12, bottom: 64, left: 52 }
        : { top: 20, right: 20, bottom: 60, left: 80 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Prepare data
    const tierNames = TIERS.map(tier => TIER_INFO[tier].name);
    const backupCosts = TIERS.map(tier => costs[tier].backup);
    const failureCosts = TIERS.map(tier => costs[tier].failure);
    const totalCosts = TIERS.map(tier => costs[tier].total);

    // Find max values for scaling
    const maxCost = Math.max(...totalCosts, ...backupCosts, ...failureCosts);

    // Create SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.classList.add('line-chart');

    // Create chart group
    const chartGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    chartGroup.setAttribute('transform', `translate(${margin.left}, ${margin.top})`);

    // Create scales
    const xScale = (i) => (i / (TIERS.length - 1)) * innerWidth;
    const yScale = (value) => innerHeight - (value / maxCost) * innerHeight;

    // Create axes
    const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    xAxis.setAttribute('transform', `translate(0, ${innerHeight})`);

    // X-axis line
    const xAxisLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    xAxisLine.setAttribute('x1', 0);
    xAxisLine.setAttribute('y1', 0);
    xAxisLine.setAttribute('x2', innerWidth);
    xAxisLine.setAttribute('y2', 0);
    xAxisLine.setAttribute('stroke', '#ddd');
    xAxisLine.setAttribute('stroke-width', 1);
    xAxis.appendChild(xAxisLine);

    // X-axis labels
    tierNames.forEach((name, i) => {
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        const x = xScale(i);
        label.setAttribute('x', x);
        label.setAttribute('y', 20);
        if (i === 0) {
            label.setAttribute('text-anchor', 'start');
        } else if (i === tierNames.length - 1) {
            label.setAttribute('text-anchor', 'end');
        } else {
            label.setAttribute('text-anchor', 'middle');
        }
        label.setAttribute('font-size', isNarrow ? '11px' : '12px');
        label.setAttribute('fill', '#333');
        label.textContent = name;
        xAxis.appendChild(label);
    });

    // Y-axis
    const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    // Y-axis line
    const yAxisLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    yAxisLine.setAttribute('x1', 0);
    yAxisLine.setAttribute('y1', 0);
    yAxisLine.setAttribute('x2', 0);
    yAxisLine.setAttribute('y2', innerHeight);
    yAxisLine.setAttribute('stroke', '#ddd');
    yAxisLine.setAttribute('stroke-width', 1);
    yAxis.appendChild(yAxisLine);

    // Y-axis labels
    const yTicks = [0, maxCost * 0.25, maxCost * 0.5, maxCost * 0.75, maxCost];
    yTicks.forEach(tick => {
        const y = yScale(tick);
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', -10);
        label.setAttribute('y', y + 4);
        label.setAttribute('text-anchor', 'end');
        label.setAttribute('font-size', isNarrow ? '10px' : '11px');
        label.setAttribute('fill', '#666');
        label.textContent = formatCurrency(tick);
        yAxis.appendChild(label);

        // Grid line
        const gridLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        gridLine.setAttribute('x1', 0);
        gridLine.setAttribute('y1', y);
        gridLine.setAttribute('x2', innerWidth);
        gridLine.setAttribute('y2', y);
        gridLine.setAttribute('stroke', '#f0f0f0');
        gridLine.setAttribute('stroke-width', 1);
        chartGroup.appendChild(gridLine);
    });

    // Create line functions
    function createLine(data, color, strokeWidth = 2) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const pathData = data.map((value, i) => {
            const x = xScale(i);
            const y = yScale(value);
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ');

        path.setAttribute('d', pathData);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', color);
        path.setAttribute('stroke-width', strokeWidth);
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('stroke-linejoin', 'round');
        return path;
    }

    // Add lines
    const totalLine = createLine(totalCosts, '#000', 3);
    const backupLine = createLine(backupCosts, '#4a90e2', 2);
    const failureLine = createLine(failureCosts, '#e84c3d', 2);

    chartGroup.appendChild(backupLine);
    chartGroup.appendChild(failureLine);
    chartGroup.appendChild(totalLine);

    // Add data points
    function addPoints(data, color, fillColor) {
        data.forEach((value, i) => {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', xScale(i));
            circle.setAttribute('cy', yScale(value));
            circle.setAttribute('r', 4);
            circle.setAttribute('fill', fillColor);
            circle.setAttribute('stroke', color);
            circle.setAttribute('stroke-width', 2);
            chartGroup.appendChild(circle);
        });
    }

    addPoints(backupCosts, '#4a90e2', '#fff');
    addPoints(failureCosts, '#e84c3d', '#fff');
    addPoints(totalCosts, '#000', '#000');

    // Highlight recommended tier
    const recIndex = TIERS.indexOf(recommended);
    if (recIndex >= 0) {
        const highlight = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        highlight.setAttribute('cx', xScale(recIndex));
        highlight.setAttribute('cy', yScale(totalCosts[recIndex]));
        highlight.setAttribute('r', 8);
        highlight.setAttribute('fill', 'none');
        highlight.setAttribute('stroke', '#000');
        highlight.setAttribute('stroke-width', 3);
        highlight.setAttribute('stroke-dasharray', '5,3');
        chartGroup.appendChild(highlight);

        // Recommended label
        const recLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        recLabel.setAttribute('x', xScale(recIndex));
        recLabel.setAttribute('y', yScale(totalCosts[recIndex]) - 15);
        recLabel.setAttribute('text-anchor', 'middle');
        recLabel.setAttribute('font-size', '12px');
        recLabel.setAttribute('font-weight', 'bold');
        recLabel.setAttribute('fill', '#000');
        recLabel.textContent = 'Recommended';
        chartGroup.appendChild(recLabel);
    }

    // Assemble chart
    chartGroup.appendChild(yAxis);
    chartGroup.appendChild(xAxis);
    svg.appendChild(chartGroup);

    // Add to container
    container.appendChild(svg);

    // Add legend
    const legend = document.createElement('div');
    legend.className = 'chart-legend';
    legend.innerHTML = `
        <div class="legend-item">
            <div class="legend-color" style="background: #4a90e2; border: 2px solid #4a90e2;"></div>
            <span>Annual backup cost</span>
        </div>
        <div class="legend-item">
            <div class="legend-color" style="background: #e84c3d; border: 2px solid #e84c3d;"></div>
            <span>Expected failure exposure</span>
        </div>
        <div class="legend-item">
            <div class="legend-color" style="background: #000; border: 2px solid #000;"></div>
            <span>Total expected annual cost</span>
        </div>
    `;
    container.appendChild(legend);
}

function renderTierCards(costs, recommended, state) {
    const container = document.getElementById('tier-cards');
    container.innerHTML = '';

    TIERS.forEach(tier => {
        const tierInfo = TIER_INFO[tier];
        const cost = costs[tier];
        const verdict = getVerdictForTier(tier, costs, state);

        const card = document.createElement('div');
        card.className = 'tier-card';
        if (tier === recommended) card.classList.add('recommended');

        card.innerHTML = `
            <div class="tier-card-name">${tierInfo.name}</div>
            <div class="tier-card-desc">${tierInfo.desc}</div>
            <div class="tier-card-cost">
                <div class="cost-item">
                    <div class="cost-label">Backup cost</div>
                    <div class="cost-value">${formatCurrency(cost.backup)}</div>
                </div>
                <div class="cost-item">
                    <div class="cost-label">Failure exposure</div>
                    <div class="cost-value">${formatCurrency(cost.failure)}</div>
                </div>
            </div>
            <div class="tier-card-total">
                <div class="tier-card-total-label">Total expected annual cost</div>
                <div class="tier-card-total-value">${formatCurrency(cost.total)}</div>
            </div>
            <div class="tier-card-verdict">${verdict}</div>
        `;

        container.appendChild(card);
    });
}

function renderBuildSteps(tier) {
    const container = document.getElementById('build-list');
    container.innerHTML = '';

    const steps = BUILD_STEPS[tier] || [];
    steps.forEach(step => {
        const li = document.createElement('li');
        li.textContent = step;
        container.appendChild(li);
    });
}

function renderAssumptions(state, costs) {
    const container = document.getElementById('assumptions-grid');
    container.innerHTML = '';

    const recommended = findRecommendedTier(costs, state);
    const recommendedCost = costs[recommended];
    const incidentProb = recommendedCost.probability;
    const avgOutage = getAverageOutageDuration(state.environment);

    const assumptions = [
        { label: 'Events per year', value: state.events },
        { label: 'Serious incident chance', value: formatPercentage(incidentProb) + ' per event' },
        { label: 'Bad-minute cost', value: '$' + state.badminute },
        { label: 'Avg outage without backup', value: avgOutage + ' min' },
        { label: 'Incident coverage (' + TIER_INFO[recommended].name + ')', value: formatPercentage(TIER_INFO[recommended].coverage) },
        { label: 'Recovery time (' + TIER_INFO[recommended].name + ')', value: TIER_INFO[recommended].recovery + ' min' },
    ];

    assumptions.forEach(assumption => {
        const item = document.createElement('div');
        item.className = 'assumption-item';
        item.innerHTML = `
            <div class="assumption-label">${assumption.label}</div>
            <div class="assumption-value">${assumption.value}</div>
        `;
        container.appendChild(item);
    });
}

function updateAllOutputs() {
    const costs = calculateTierCosts(state);
    const recommended = findRecommendedTier(costs, state);

    renderRecommendation(recommended, state, costs);
    renderChart(costs, recommended);
    renderTierCards(costs, recommended, state);
    renderBuildSteps(recommended);
    renderAssumptions(state, costs);
}

// Event listeners
function attachInputListeners() {
    // Button inputs
    document.querySelectorAll('.btn-option').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const input = e.target.dataset.input;
            const value = e.target.dataset.value;

            // Update active state
            document.querySelectorAll(`.btn-option[data-input="${input}"]`).forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            // Update state
            state[input] = isNaN(value) ? value : Number(value);
            saveState();
            updateAllOutputs();
        });
    });

    // Card inputs
    document.querySelectorAll('.card-option').forEach(card => {
        card.addEventListener('click', (e) => {
            const target = e.currentTarget;
            const input = target.dataset.input;
            const value = target.dataset.value;

            // Update active state
            document.querySelectorAll(`.card-option[data-input="${input}"]`).forEach(c => c.classList.remove('active'));
            target.classList.add('active');

            // Update state
            state[input] = value;
            saveState();
            updateAllOutputs();
        });
    });

    // Slider inputs (discrete steps)
    wireDiscreteSlider('events-slider', eventSteps, (value) => {
        state.events = value;
    });
    wireDiscreteSlider('audience-slider', audienceSteps, (value) => {
        state.audience = value;
    });
    wireDiscreteSlider('stakes-slider', stakeSteps, (value) => {
        state.stakes = value;
        updateStakesComment(value);
    });
    wireDiscreteSlider('outage-slider', outageSteps, (value) => {
        state.outage = value;
        updateOutageComment(value);
    });
    wireDiscreteSlider('environment-slider', environmentSteps, (value) => {
        state.environment = value;
        updateEnvironmentComment(value);
    });
    wireDiscreteSlider('appetite-slider', appetiteSteps, (value) => {
        state.appetite = value;
        updateAppetiteComment(value);
    });
    wireDiscreteSlider('badminute-slider', badMinuteSteps, (value) => {
        state.badminute = value;
    });

    // Assumptions toggle
    const toggle = document.getElementById('assumptions-toggle');
    const panel = document.getElementById('assumptions-panel');
    toggle.addEventListener('click', () => {
        toggle.classList.toggle('open');
        if (panel.style.display === 'none') {
            panel.style.display = 'block';
        } else {
            panel.style.display = 'none';
        }
    });

    // Mobile controls drawer toggle
    const controlsToggle = document.getElementById('controls-toggle-mobile');
    const inputsPanel = document.getElementById('inputs-panel');
    if (controlsToggle && inputsPanel) {
        controlsToggle.addEventListener('click', () => {
            const isOpen = inputsPanel.classList.toggle('mobile-open');
            controlsToggle.textContent = isOpen ? 'Hide Controls' : 'Show Controls';
        });
    }
}

// Initialize
function init() {
    loadState();
    attachInputListeners();

    // Clear all active states first
    document.querySelectorAll('.btn-option.active, .card-option.active').forEach(el => {
        el.classList.remove('active');
    });

    // Set active states from loaded state
    for (const [key, value] of Object.entries(state)) {
        const selector = `.btn-option[data-input="${key}"][data-value="${value}"], .card-option[data-input="${key}"][data-value="${value}"]`;
        document.querySelectorAll(selector).forEach(el => el.classList.add('active'));
    }

    // Initialize slider from loaded state
    const eventsSlider = document.getElementById('events-slider');
    if (eventsSlider) {
        const idx = Math.max(0, eventSteps.indexOf(Number(state.events)));
        eventsSlider.value = String(idx);
    }

    const audienceSlider = document.getElementById('audience-slider');
    if (audienceSlider) {
        const idx = Math.max(0, audienceSteps.indexOf(Number(state.audience)));
        audienceSlider.value = String(idx);
    }

    const stakesSlider = document.getElementById('stakes-slider');
    if (stakesSlider) {
        const idx = Math.max(0, stakeSteps.indexOf(state.stakes));
        stakesSlider.value = String(idx);
    }
    updateStakesComment(state.stakes);

    const outageSlider = document.getElementById('outage-slider');
    if (outageSlider) {
        const idx = Math.max(0, outageSteps.indexOf(state.outage));
        outageSlider.value = String(idx);
    }
    updateOutageComment(state.outage);

    const environmentSlider = document.getElementById('environment-slider');
    if (environmentSlider) {
        const idx = Math.max(0, environmentSteps.indexOf(state.environment));
        environmentSlider.value = String(idx);
    }
    updateEnvironmentComment(state.environment);

    const appetiteSlider = document.getElementById('appetite-slider');
    if (appetiteSlider) {
        const idx = Math.max(0, appetiteSteps.indexOf(state.appetite));
        appetiteSlider.value = String(idx);
    }
    updateAppetiteComment(state.appetite);

    const badMinuteSlider = document.getElementById('badminute-slider');
    if (badMinuteSlider) {
        const idx = Math.max(0, badMinuteSteps.indexOf(Number(state.badminute)));
        badMinuteSlider.value = String(idx);
    }

    updateAllOutputs();
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
