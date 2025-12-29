import Agent from "../core/agent.js";

export default class SARSA extends Agent {
    constructor(actions, alpha = 0.1, gamma = 0.99, epsilon = 0.1) {
        super(actions);
        this.alpha = alpha;
        this.gamma = gamma;
        this.epsilon = epsilon;
        this.qTable = {};
        this.training = true;
        this.previousPolicy = {};
        this.stableEpisodes = 0;
    }

    // ADD THIS METHOD: Consistent state key generation
    getStateKey(state) {
        if (typeof state === 'string') {
            return state;
        } else if (state && state.x !== undefined && state.y !== undefined) {
            // GridWorld, FrozenLake, CliffWalking
            return `${state.x},${state.y}`;
        } else if (state && state.position !== undefined && state.velocity !== undefined) {
            // MountainCar: discretize continuous state
            const pos = Math.round(state.position * 10);
            const vel = Math.round(state.velocity * 10);
            return `${pos},${vel}`;
        } else if (typeof state === 'object' && state !== null) {
            return JSON.stringify(state);
        }
        return String(state);
    }

    getGreedyAction(state) {
        const stateKey = this.getStateKey(state); // FIXED: Use getStateKey
        if (!this.qTable[stateKey]) return null;
        let bestAction = this.actions[0];
        let bestValue = -Infinity;
        for (const action of this.actions) {
            const value = this.qTable[stateKey][action] || 0;
            if (value > bestValue) {
                bestValue = value;
                bestAction = action;
            }
        }
        return bestAction;
    }

    act(state) {
        // Epsilon-greedy
        if (Math.random() < this.epsilon && this.training) {
            return this.actions[Math.floor(Math.random() * this.actions.length)];
        }

        const stateKey = this.getStateKey(state); // FIXED: Use getStateKey

        // Initialize if new state
        if (!this.qTable[stateKey]) {
            this.qTable[stateKey] = {};
            this.actions.forEach(action => {
                this.qTable[stateKey][action] = 0;
            });
            
            // For new states, return random action
            return this.actions[Math.floor(Math.random() * this.actions.length)];
        }

        // Greedy action
        let bestAction = this.actions[0];
        let bestValue = -Infinity;

        for (const action of this.actions) {
            const value = this.qTable[stateKey][action] || 0;
            if (value > bestValue) {
                bestValue = value;
                bestAction = action;
            }
        }

        return bestAction;
    }

    learn(state, action, reward, nextState, nextAction) {
        const stateKey = this.getStateKey(state);
        const nextStateKey = this.getStateKey(nextState);

        // Initialize if needed
        if (!this.qTable[stateKey]) {
            this.qTable[stateKey] = {};
        }
        if (this.qTable[stateKey][action] === undefined) {
            this.qTable[stateKey][action] = 0;
        }

        if (!this.qTable[nextStateKey]) {
            this.qTable[nextStateKey] = {};
            this.actions.forEach(a => {
                this.qTable[nextStateKey][a] = 0;
            });
        }

        // SARSA update uses the next action actually taken
        const nextQ = this.qTable[nextStateKey][nextAction] || 0;
        const currentQ = this.qTable[stateKey][action];
        const newQ = currentQ + this.alpha * (reward + this.gamma * nextQ - currentQ);
        this.qTable[stateKey][action] = newQ;

        return newQ;
    }
}