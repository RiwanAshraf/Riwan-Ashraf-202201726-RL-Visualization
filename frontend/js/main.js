// main.js - using ES6 modules
import GridWorld from "./environments/GridWorld.js";
import FrozenLake from "./environments/FrozenLake.js";
import MountainCar from './environments/MountainCar.js';
import CliffWalking from "./environments/CliffWalking.js";

import SARSA from "./agents/SARSA.js";
import QLearning from "./agents/QLearning.js";
import ExpectedSARSA from "./agents/ExpectedSARSA.js";
import Loop from "./core/loop.js";

console.log("RL Environment loading...");

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded, initializing...");

    // Get canvas
    const canvas = document.getElementById('envCanvas');
    if (!canvas) {
        console.error("Canvas element 'envCanvas' not found!");
        return;
    }

    canvas.width = 600;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');

    let showArrows = false;
    let showNumbers = false;
    let showHeatmap = false;

    console.log("Creating environment and agent...");

    // Create environment and agent
    const selectedEnv = localStorage.getItem('currentEnvironment') || 'gridworld';
    console.log("Selected environment:", selectedEnv);

    let env;

    switch (selectedEnv) {
        case 'frozenlake':
            env = new FrozenLake(false);
            break;
        case 'mountaincar':
            env = new MountainCar();
            break;
        case 'cliffwalking':
            env = new CliffWalking();
            break;
        case 'gridworld':
        default:
            env = new GridWorld(10);
            env.setAgentShape('cutefrog');
            break;
    }

    // Initial render
    console.log("Performing initial render...");
    env.render(ctx);

    const algorithmSelect = document.getElementById('algorithmSelect');
    let agent = createAgent(algorithmSelect.value);

    algorithmSelect.addEventListener('change', () => {
        agent = createAgent(algorithmSelect.value);
        console.log("Algorithm switched to:", algorithmSelect.value);
    });

    const loop = new Loop(env, agent, ctx);

    // Initialize stats display
    ['lastAction', 'lastReward', 'qValue'].forEach(id => {
        document.getElementById(id).textContent = '-';
    });

    ['stepCount', 'totalReward', 'episodeCount'].forEach(id => {
        document.getElementById(id).textContent = '0';
    });

    document.getElementById('successRate').textContent = '0%';

    // Button event listeners
    document.getElementById('stepBtn').addEventListener('click', () => {
        console.log("Step button clicked");
        loop.step();
    });

    // Add a reset button for the agent
    document.getElementById('resetBtn').addEventListener('click', () => {
        console.log("Resetting agent...");

        // Reset Q-table
        agent.qTable = {};
        agent.previousPolicy = {};
        agent.stableEpisodes = 0;
        agent.stableStartEpisode = null;
        agent.episodeRewards = [];

        // Reset environment
        env.reset();
        env.render(ctx);

        // Reset UI
        ['stepCount', 'totalReward', 'episodeCount'].forEach(id => {
            document.getElementById(id).textContent = '0';
        });
        document.getElementById('successRate').textContent = '0%';

        console.log("Agent reset complete");
    });

    // Run Episode button
    document.getElementById('runBtn').addEventListener('click', () => {
        console.log("Run Episode clicked");
        runEpisode(loop, env, 100);
    });

    const showArrowsCheckbox = document.getElementById('showArrowsCheckbox');
    const showNumbersCheckbox = document.getElementById('showNumbersCheckbox');

    showArrowsCheckbox.checked = false;
    showNumbersCheckbox.checked = false;
    showHeatmap = true;

    showArrowsCheckbox.addEventListener('change', () => {
        showArrows = showArrowsCheckbox.checked;
        if (showHeatmap) renderQHeatmap();
    });

    showNumbersCheckbox.addEventListener('change', () => {
        showNumbers = showNumbersCheckbox.checked;
        if (showHeatmap) renderQHeatmap();
    });

    // Train button
    function runEpisode(loop, env, maxSteps = 100) {
        loop.reset();
        let stepCount = 0;

        // Environment-specific visual delays
        const VISUAL_DELAY = env.constructor.name === 'MountainCar' ? 50 : 120;

        function stepLoop() {
            if (!env.isDone && stepCount < maxSteps) {
                loop.step();
                env.render(ctx);
                stepCount++;
                setTimeout(stepLoop, VISUAL_DELAY);
            }
        }
        stepLoop();
    }

    function updateTrainingStatus() {
        const statusEl = document.getElementById('trainingStatus');
        const envName = env.constructor.name;

        if (agent.training) {
            let statusText = "Training: Active | ";

            if (envName === 'GridWorld') {
                statusText += `Stable Episodes: ${agent.stableEpisodes} / 50`;
            } else if (envName === 'FrozenLake') {
                const successRate = agent.recentSuccesses.length > 0 ?
                    (agent.recentSuccesses.reduce((a, b) => a + b, 0) /
                        agent.recentSuccesses.length * 100).toFixed(1) : 0;
                statusText += `Success Rate: ${successRate}%`;
            } else if (envName === 'MountainCar') {
                const successRate = agent.recentSuccesses.length > 0 ?
                    (agent.recentSuccesses.reduce((a, b) => a + b, 0) /
                        agent.recentSuccesses.length * 100).toFixed(1) : 0;
                const avgSteps = agent.recentSteps.length > 0 ?
                    (agent.recentSteps.reduce((a, b) => a + b, 0) /
                        agent.recentSteps.length).toFixed(1) : 0;
                statusText += `Success: ${successRate}% | Avg Steps: ${avgSteps}`;
            } else if (envName === 'CliffWalking') {
                const successRate = agent.recentSuccesses.length > 0 ?
                    (agent.recentSuccesses.reduce((a, b) => a + b, 0) /
                        agent.recentSuccesses.length * 100).toFixed(1) : 0;
                const avgReward = agent.episodeRewards.length > 0 ?
                    (agent.episodeRewards.slice(-50).reduce((a, b) => a + b, 0) /
                        Math.min(50, agent.episodeRewards.length)).toFixed(1) : 0;
                statusText += `Success: ${successRate}% | Avg Reward: ${avgReward}`;
            }

            statusEl.textContent = statusText;
            statusEl.style.color = '#f59e0b';
        } else {
            statusEl.textContent = `Training: Converged`;
            statusEl.style.color = '#10b981';
        }
    }

    function updateTrainingProgress(currentEpisode, totalEpisodes) {
        const greenEl = document.getElementById('progressGreen');
        const yellowEl = document.getElementById('progressYellow');
        const textEl = document.getElementById('trainingProgressText');
        const maxLabel = document.getElementById('trainingProgressMax');

        const totalPercent = 100;

        if (agent.stableStartEpisode !== null) {
            const stablePercent = (agent.stableStartEpisode / totalEpisodes) * totalPercent;
            const afterStablePercent = ((currentEpisode - agent.stableStartEpisode) / totalEpisodes) * totalPercent;

            greenEl.style.width = `${stablePercent}%`;
            yellowEl.style.width = `${afterStablePercent}%`;
            yellowEl.style.left = `${stablePercent}%`;

            textEl.textContent = `Stable at ${agent.stableStartEpisode} | Total ${currentEpisode}`;
        } else {
            const percent = (currentEpisode / totalEpisodes) * totalPercent;
            greenEl.style.width = `${percent}%`;
            yellowEl.style.width = '0%';
            textEl.textContent = `Episode ${currentEpisode}`;
        }

        maxLabel.style.display = 'block';
        maxLabel.textContent = totalEpisodes;
    }

    function updateRewardChart(rewards, stableStartEpisode) {
        rewardChart.data.labels = rewards.map((_, i) => i + 1);
        rewardChart.data.datasets[0].data = rewards;
        rewardChart.update();
    }

    function drawMaxArrow(ctx, x, y, cellSize, qValues) {
        const centerX = x * cellSize + cellSize / 2;
        const centerY = y * cellSize + cellSize / 2;
        const arrowLength = cellSize / 3;

        const maxAction = Object.keys(qValues).reduce((a, b) =>
            qValues[a] > qValues[b] ? a : b
        );

        ctx.strokeStyle = 'black';
        ctx.fillStyle = 'black';
        ctx.lineWidth = 2;

        ctx.beginPath();
        switch (maxAction) {
            case 'up':
                ctx.moveTo(centerX, centerY);
                ctx.lineTo(centerX, centerY - arrowLength);
                ctx.lineTo(centerX - 4, centerY - arrowLength + 6);
                ctx.moveTo(centerX, centerY - arrowLength);
                ctx.lineTo(centerX + 4, centerY - arrowLength + 6);
                break;
            case 'down':
                ctx.moveTo(centerX, centerY);
                ctx.lineTo(centerX, centerY + arrowLength);
                ctx.lineTo(centerX - 4, centerY + arrowLength - 6);
                ctx.moveTo(centerX, centerY + arrowLength);
                ctx.lineTo(centerX + 4, centerY + arrowLength - 6);
                break;
            case 'left':
                ctx.moveTo(centerX, centerY);
                ctx.lineTo(centerX - arrowLength, centerY);
                ctx.lineTo(centerX - arrowLength + 6, centerY - 4);
                ctx.moveTo(centerX - arrowLength, centerY);
                ctx.lineTo(centerX - arrowLength + 6, centerY + 4);
                break;
            case 'right':
                ctx.moveTo(centerX, centerY);
                ctx.lineTo(centerX + arrowLength, centerY);
                ctx.lineTo(centerX + arrowLength - 6, centerY - 4);
                ctx.moveTo(centerX + arrowLength, centerY);
                ctx.lineTo(centerX + arrowLength - 6, centerY + 4);
                break;
        }
        ctx.stroke();
    }

    function renderQHeatmap() {
        if (env.constructor.name === 'MountainCar' || env.constructor.name === 'CliffWalking') {
            env.render(ctx);
            return;
        }

        const size = env.size;
        const cellSize = canvas.width / size;

        let values = [];
        for (const key in agent.qTable) {
            const maxQ = Math.max(...Object.values(agent.qTable[key]));
            values.push(maxQ);
        }

        const minQ = Math.min(...values);
        const maxQ = Math.max(...values);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const stateKey = `${x},${y}`;
                let value = 0;
                let qValues = { up: 0, down: 0, left: 0, right: 0 };

                if (agent.qTable[stateKey]) {
                    qValues = agent.qTable[stateKey];
                    value = Math.max(...Object.values(agent.qTable[stateKey]));
                }

                if (showArrows || showNumbers) {
                    const norm = maxQ === minQ ? 0 : (value - minQ) / (maxQ - minQ);
                    let fillColor;
                    if (norm < 0.25) fillColor = '#fff9e0';
                    else if (norm < 0.5) fillColor = '#fff59d';
                    else if (norm < 0.75) fillColor = '#ffb74d';
                    else fillColor = '#f44336';

                    ctx.fillStyle = fillColor;
                    ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                }

                if (showArrows && agent.qTable[stateKey]) {
                    drawMaxArrow(ctx, x, y, cellSize, qValues);
                }

                if (showNumbers && agent.qTable[stateKey]) {
                    ctx.fillStyle = 'black';
                    ctx.font = `${cellSize / 5}px monospace`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(
                        value.toFixed(1),
                        x * cellSize + cellSize / 2,
                        y * cellSize + cellSize / 2
                    );
                }

                ctx.strokeStyle = '#e5e7eb';
                ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
            }
        }
    }

    function checkPolicyStability(agent) {
        const envName = env.constructor.name;

        if (envName === 'MountainCar') return;

        let policyChanged = false;

        if (envName === 'FrozenLake') {
            const size = 4;
            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    const state = { x, y };
                    const stateKey = agent.getStateKey(state);
                    const currentBestAction = agent.getGreedyAction(state);
                    const previousBestAction = agent.previousPolicy[stateKey];

                    if (previousBestAction !== undefined && currentBestAction !== previousBestAction) {
                        policyChanged = true;
                    }
                    agent.previousPolicy[stateKey] = currentBestAction;
                }
            }
        } else if (envName === 'CliffWalking') {
            for (let y = 0; y < env.rows; y++) {
                for (let x = 0; x < env.cols; x++) {
                    const state = { x, y };
                    const stateKey = agent.getStateKey(state);
                    const currentBestAction = agent.getGreedyAction(state);
                    const previousBestAction = agent.previousPolicy[stateKey];

                    if (previousBestAction !== undefined && currentBestAction !== previousBestAction) {
                        policyChanged = true;
                    }
                    agent.previousPolicy[stateKey] = currentBestAction;
                }
            }
        } else if (envName === 'GridWorld') {
            for (const stateKey in agent.qTable) {
                const bestAction = agent.getGreedyAction(stateKey);
                if (agent.previousPolicy[stateKey] !== bestAction) {
                    policyChanged = true;
                    break;
                }
            }

            agent.previousPolicy = {};
            for (const stateKey in agent.qTable) {
                agent.previousPolicy[stateKey] = agent.getGreedyAction(stateKey);
            }
        }

        if (!policyChanged) {
            if (agent.stableStartEpisode === null) {
                agent.stableStartEpisode = parseInt(document.getElementById('episodeCount').textContent) || 0;
            }
            agent.stableEpisodes++;
        } else {
            agent.stableStartEpisode = null;
            agent.stableEpisodes = 0;
        }
    }

    function trainAgent(agent, env) {
        agent.training = true;

        const envName = env.constructor.name;
        console.log(`Starting training for ${envName}...`);

        // Set environment-specific parameters
        if (envName === 'FrozenLake') {
            agent.epsilon = 0.4;
            agent.alpha = 0.3;
            agent.gamma = 0.99;
            console.log(`FrozenLake params: α=${agent.alpha}, γ=${agent.gamma}, ε=${agent.epsilon}`);
        } else if (envName === 'MountainCar') {
            agent.epsilon = 0.3;
            agent.alpha = 0.2;
            agent.gamma = 0.99;
            console.log(`MountainCar params: α=${agent.alpha}, γ=${agent.gamma}, ε=${agent.epsilon}`);
        } else if (envName === 'CliffWalking') {
            agent.epsilon = 0.1;
            agent.alpha = 0.5;
            agent.gamma = 0.9;
            console.log(`CliffWalking params: α=${agent.alpha}, γ=${agent.gamma}, ε=${agent.epsilon}`);
        } else {
            agent.epsilon = 0.1;
            agent.alpha = 0.1;
            agent.gamma = 0.9;
        }

        // Reset tracking variables
        agent.stableEpisodes = 0;
        agent.previousPolicy = {};
        agent.stableStartEpisode = null;
        agent.episodeRewards = [];

        const WINDOW_SIZE = 100;
        agent.recentRewards = [];
        agent.recentSuccesses = [];
        agent.recentSteps = [];

        // Disable buttons during training
        document.getElementById('trainBtn').disabled = true;
        document.getElementById('runBtn').disabled = true;
        document.getElementById('stepBtn').disabled = true;

        // Reset UI elements
        const statusEl = document.getElementById('trainingStatus');
        statusEl.textContent = `Training: Starting...`;
        statusEl.style.color = '#f59e0b';

        // Reset progress bars
        document.getElementById('progressGreen').style.width = '0%';
        document.getElementById('progressYellow').style.width = '0%';
        document.getElementById('trainingProgressText').textContent = 'Episode 0';

        // Clear and reset chart
        if (rewardChart) {
            rewardChart.data.labels = [];
            rewardChart.data.datasets[0].data = [];
            rewardChart.update();
        }

        let currentEpisodes = parseInt(document.getElementById('episodeCount').textContent) || 0;

        function trainEpisode() {
            if (!agent.training) return;

            let episodeTotalReward = 0;
            let state = env.reset();
            let action = agent.act(state);
            let steps = 0;

            const MAX_STEPS = envName === 'MountainCar' ? 330 :
                envName === 'CliffWalking' ? 200 :
                    envName === 'FrozenLake' ? 200 : 100;

            while (!env.isDone && steps < MAX_STEPS) {
                const { nextState, reward } = env.step(action);
                let nextAction;

                if (agent instanceof SARSA) {
                    nextAction = agent.act(nextState);
                    agent.learn(state, action, reward, nextState, nextAction);
                } else {
                    agent.learn(state, action, reward, nextState);
                    nextAction = agent.act(nextState);
                }

                state = nextState;
                action = nextAction;
                episodeTotalReward += reward;
                steps++;

                if (envName === 'FrozenLake' && reward === -0.001) {
                    episodeTotalReward += 0.001;
                }
            }

            currentEpisodes++;

            // DEBUG: Print progress every 50 episodes
            if (currentEpisodes % 50 === 0 || currentEpisodes === 1) {
                const qSize = Object.keys(agent.qTable).length;
                console.log(`Episode ${currentEpisodes}:`);
                console.log(`  Q-table states: ${qSize}`);
                console.log(`  Steps: ${steps}, Reward: ${episodeTotalReward.toFixed(2)}`);
            }

            // Track episode data
            agent.episodeRewards.push(episodeTotalReward);
            agent.recentSteps.push(steps);

            if (agent.recentSteps.length > WINDOW_SIZE) {
                agent.recentSteps.shift();
            }

            // Update UI displays
            document.getElementById('lastEpisodeReward').textContent = episodeTotalReward.toFixed(2);
            document.getElementById('episodeCount').textContent = currentEpisodes;

            // Determine if episode was successful
            let success = false;
            if (envName === 'MountainCar') {
                success = steps < MAX_STEPS && env.isDone;
                if (success && currentEpisodes % 20 === 0) {
                    console.log(`MountainCar SUCCESS at episode ${currentEpisodes}! Steps: ${steps}`);
                }
            } else if (envName === 'FrozenLake') {
                success = episodeTotalReward > 0.9;
                if (success && currentEpisodes % 20 === 0) {
                    console.log(`FrozenLake SUCCESS at episode ${currentEpisodes}! Reward: ${episodeTotalReward.toFixed(3)}`);
                }
            } else if (envName === 'CliffWalking') {
                // Success if reward >= -13 (optimal path is -13 steps)
                success = episodeTotalReward >= -13;
                if (success && currentEpisodes % 20 === 0) {
                    console.log(`CliffWalking SUCCESS at episode ${currentEpisodes}! Reward: ${episodeTotalReward.toFixed(1)}`);
                }
            } else if (envName === 'GridWorld') {
                success = episodeTotalReward >= 0.9;
            }

            // Track success rate
            agent.recentSuccesses.push(success ? 1 : 0);
            if (agent.recentSuccesses.length > WINDOW_SIZE) {
                agent.recentSuccesses.shift();
            }

            const successRate = agent.recentSuccesses.length > 0 ?
                (agent.recentSuccesses.reduce((a, b) => a + b, 0) /
                    agent.recentSuccesses.length * 100) : 0;

            document.getElementById('successRate').textContent = `${successRate.toFixed(1)}%`;

            // Update chart every 10 episodes for performance
            if (currentEpisodes % 10 === 0 && currentEpisodes <= 500) {
                updateRewardChart(agent.episodeRewards.slice(-200), agent.stableStartEpisode);
            }

            // Update progress visualization
            updateTrainingProgress(currentEpisodes, 1000);
            updateTrainingStatus();

            // Environment-specific convergence criteria
            let shouldStop = false;
            let convergenceReason = "";

            if (envName === 'MountainCar') {
                const minEpisodes = 100;
                if (currentEpisodes >= minEpisodes) {
                    const windowSize = 50;
                    const recentSuccesses = agent.recentSuccesses.slice(-windowSize);
                    const recentSuccessRate = recentSuccesses.length > 0 ?
                        (recentSuccesses.reduce((a, b) => a + b, 0) / recentSuccesses.length * 100) : 0;

                    if (recentSuccessRate >= 65 && currentEpisodes > 200) {
                        shouldStop = true;
                        convergenceReason = `Success rate ${recentSuccessRate.toFixed(1)}% for 50 episodes`;
                    }
                }

                const MAX_EPISODES = 2000;
                if (currentEpisodes >= MAX_EPISODES) {
                    shouldStop = true;
                    convergenceReason = `Reached max episodes (${MAX_EPISODES})`;
                }
            } else if (envName === 'FrozenLake') {
                const minEpisodes = 150;
                if (currentEpisodes >= minEpisodes) {
                    checkPolicyStability(agent);

                    const windowSize = 50;
                    const recentSuccesses = agent.recentSuccesses.slice(-windowSize);
                    const recentSuccessRate = recentSuccesses.length > 0 ?
                        (recentSuccesses.reduce((a, b) => a + b, 0) / recentSuccesses.length * 100) : 0;

                    if (agent.stableEpisodes >= 30) {
                        shouldStop = true;
                        convergenceReason = `Policy stable for ${agent.stableEpisodes} episodes`;
                    } else if (recentSuccessRate >= 85 && currentEpisodes > 200) {
                        shouldStop = true;
                        convergenceReason = `Success rate ${recentSuccessRate.toFixed(1)}% for 50 episodes`;
                    }
                }

                const MAX_EPISODES = 800;
                if (currentEpisodes >= MAX_EPISODES) {
                    shouldStop = true;
                    convergenceReason = `Reached max episodes (${MAX_EPISODES})`;
                }
            } else if (envName === 'CliffWalking') {
                // CLIFFWALKING CONVERGENCE LOGIC
                const minEpisodes = 100;
                if (currentEpisodes >= minEpisodes) {
                    checkPolicyStability(agent);

                    const windowSize = 50;
                    const recentRewards = agent.episodeRewards.slice(-windowSize);
                    const avgRecentReward = recentRewards.length > 0 ?
                        recentRewards.reduce((a, b) => a + b, 0) / recentRewards.length : 0;

                    // Optimal path is -13 reward per episode
                    if (avgRecentReward >= -14 && currentEpisodes > 150) {
                        shouldStop = true;
                        convergenceReason = `Average reward ${avgRecentReward.toFixed(1)} (near optimal)`;
                    } else if (agent.stableEpisodes >= 30) {
                        shouldStop = true;
                        convergenceReason = `Policy stable for ${agent.stableEpisodes} episodes`;
                    }
                }

                const MAX_EPISODES = 500;
                if (currentEpisodes >= MAX_EPISODES) {
                    shouldStop = true;
                    convergenceReason = `Reached max episodes (${MAX_EPISODES})`;
                }
            } else if (envName === 'GridWorld') {
                checkPolicyStability(agent);
                shouldStop = agent.stableEpisodes >= 50;
                if (shouldStop) {
                    convergenceReason = "Policy stable for 50 episodes";
                }

                const MAX_EPISODES = 500;
                if (currentEpisodes >= MAX_EPISODES) {
                    shouldStop = true;
                    convergenceReason = `Reached max episodes (${MAX_EPISODES})`;
                }
            }

            if (shouldStop) {
                // Training complete
                agent.training = false;

                // Set final epsilon
                if (envName === 'FrozenLake') {
                    agent.epsilon = 0.05;
                } else if (envName === 'MountainCar') {
                    agent.epsilon = 0.1;
                } else {
                    agent.epsilon = 0;
                }

                // Final debug output
                console.log("=== TRAINING COMPLETED ===");
                console.log(`Environment: ${envName}`);
                console.log(`Total episodes: ${currentEpisodes}`);
                console.log(`Final success rate: ${successRate.toFixed(1)}%`);
                console.log(`Final epsilon: ${agent.epsilon}`);

                // Print Q-table statistics
                const qSize = Object.keys(agent.qTable).length;
                console.log(`Q-table size: ${qSize} states`);

                // Show learned policy
                if (envName === 'FrozenLake') {
                    console.log("Learned policy:");
                    renderFrozenLakePolicy();
                } else if (envName === 'CliffWalking') {
                    console.log("Learned policy:");
                    renderCliffWalkingPolicy();
                }

                // Update UI
                statusEl.textContent = `Training finished: ${convergenceReason}`;
                statusEl.style.color = '#10b981';

                // Re-enable buttons
                document.getElementById('trainBtn').disabled = false;
                document.getElementById('runBtn').disabled = false;
                document.getElementById('stepBtn').disabled = false;

                // Final render
                env.render(ctx);
                updateRewardChart(agent.episodeRewards, agent.stableStartEpisode);

                return;
            }

            // Decay epsilon for exploration
            if (currentEpisodes % 100 === 0 && agent.epsilon > 0.05) {
                agent.epsilon *= 0.95;
            }

            // Continue training
            setTimeout(trainEpisode, 0);
        }

        // Start training
        console.log("Starting training episodes...");
        trainEpisode();
    }

    function createAgent(algorithm) {
        const actions = env.constructor.name === 'MountainCar'
            ? ['left', 'none', 'right']
            : ['up', 'down', 'left', 'right'];

        const envName = env.constructor.name;
        let alpha, gamma, epsilon;

        if (envName === 'FrozenLake') {
            alpha = 0.2;
            gamma = 0.99;
            epsilon = 0.3;
        } else if (envName === 'CliffWalking') {
            alpha = 0.5;
            gamma = 0.9;
            epsilon = 0.1;
        } else if (envName === 'MountainCar') {
            alpha = 0.3;
            gamma = 0.99;
            epsilon = 0.3;
        } else {
            alpha = 0.1;
            gamma = 0.99;
            epsilon = 0.1;
        }

        // Update UI
        document.getElementById('learningRate').value = alpha;
        document.getElementById('discount').value = gamma;
        document.getElementById('epsilon').value = epsilon;

        switch (algorithm) {
            case 'sarsa':
                return new SARSA(actions, alpha, gamma, epsilon);
            case 'expectedsarsa':
                return new ExpectedSARSA(actions, alpha, gamma, epsilon);
            case 'qlearning':
            default:
                const agent = new QLearning(actions, alpha, gamma, epsilon);
                console.log(`Created ${algorithm} agent for ${envName}`);
                return agent;
        }
    }

    function renderFrozenLakePolicy() {
        if (env.constructor.name !== 'FrozenLake') return;

        console.log("FrozenLake Learned Policy:");
        const size = 4;

        for (let y = 0; y < size; y++) {
            let row = "";
            for (let x = 0; x < size; x++) {
                const state = { x, y };
                const action = agent.getGreedyAction(state);
                const tile = env.map[y][x];

                let symbol = "?";
                if (action === 'up') symbol = "↑";
                else if (action === 'down') symbol = "↓";
                else if (action === 'left') symbol = "←";
                else if (action === 'right') symbol = "→";
                if (tile === 'H') symbol = "H";
                if (tile === 'G') symbol = "G";
                if (tile === 'S') symbol = "S";

                row += symbol + "\t";
            }
            console.log(row);
        }
    }

    function renderCliffWalkingPolicy() {
        if (env.constructor.name !== 'CliffWalking') return;

        console.log("=== CLIFF WALKING LEARNED POLICY ===");

        for (let y = 0; y < env.rows; y++) {
            let row = "";
            for (let x = 0; x < env.cols; x++) {
                const state = { x, y };
                const action = agent.getGreedyAction(state);

                let symbol = "•";
                if (action === 'up') symbol = "↑";
                else if (action === 'down') symbol = "↓";
                else if (action === 'left') symbol = "←";
                else if (action === 'right') symbol = "→";

                if (env.isCliff(x, y)) symbol = "C";
                if (x === env.start.x && y === env.start.y) symbol = "S";
                if (x === env.goal.x && y === env.goal.y) symbol = "G";

                row += symbol + " ";
            }
            console.log(row);
        }
    }

    // Initialize chart once
    const rewardCtx = document.getElementById('rewardChart').getContext('2d');
    const rewardChart = new Chart(rewardCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Episode Reward',
                data: [],
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                tension: 0.3,
                fill: true,
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                x: { title: { display: true, text: 'Episode' } },
                y: { title: { display: true, text: 'Reward' }, beginAtZero: true }
            }
        }
    });

    // Add event listeners
    document.getElementById('trainBtn').addEventListener('click', () => {
        console.log("Train button clicked");

        const statusEl = document.getElementById('trainingStatus');
        statusEl.style.color = '#f59e0b';

        if (rewardChart) {
            rewardChart.data.labels = [];
            rewardChart.data.datasets[0].data = [];
            rewardChart.update();
        }

        document.getElementById('progressGreen').style.width = '0%';
        document.getElementById('progressYellow').style.width = '0%';
        document.getElementById('trainingProgressText').textContent = 'Episode 0';

        trainAgent(agent, env);
    });

    // Hyperparameter controls
    document.getElementById('learningRate').addEventListener('input', (e) => {
        agent.alpha = parseFloat(e.target.value);
        console.log("Learning rate updated to:", agent.alpha);
    });

    document.getElementById('epsilon').addEventListener('input', (e) => {
        agent.epsilon = parseFloat(e.target.value);
        console.log("Epsilon updated to:", agent.epsilon);
    });

    document.getElementById('discount').addEventListener('input', (e) => {
        agent.gamma = parseFloat(e.target.value);
        console.log("Discount factor updated to:", agent.gamma);
    });

    console.log("Environment initialized successfully!");
});