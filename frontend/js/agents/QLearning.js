// agents/QLearning.js
import Agent from "../core/agent.js";

export default class QLearning extends Agent {
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

    // Helper to convert any state to a string key
    // In QLearning.js - Update getStateKey method
    // In QLearning.js - Update getStateKey method
    getStateKey(state) {
        if (typeof state === 'string') {
            return state;
        } else if (state && state.x !== undefined && state.y !== undefined) {
            return `${state.x},${state.y}`;
        } else if (typeof state === 'object' && state !== null) {
            return JSON.stringify(state);
        }
        return String(state);
    }

    getGreedyAction(state) {
        const stateKey = this.getStateKey(state);
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

        const stateKey = this.getStateKey(state);

        // Initialize if new state
        if (!this.qTable[stateKey]) {
            this.qTable[stateKey] = {};
            this.actions.forEach(action => {
                this.qTable[stateKey][action] = 0;
            });

            // For new states during training, explore
            if (this.training) {
                return this.actions[Math.floor(Math.random() * this.actions.length)];
            }
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

    learn(state, action, reward, nextState) {
        const stateKey = this.getStateKey(state);
        const nextStateKey = this.getStateKey(nextState);

        // Initialize current state if needed
        if (!this.qTable[stateKey]) {
            this.qTable[stateKey] = {};
        }
        if (this.qTable[stateKey][action] === undefined) {
            this.qTable[stateKey][action] = 0;
        }

        // Initialize next state if needed
        if (!this.qTable[nextStateKey]) {
            this.qTable[nextStateKey] = {};
            this.actions.forEach(a => {
                this.qTable[nextStateKey][a] = 0;
            });
        }

        // Find max Q for next state
        let maxNextQ = -Infinity;
        for (const a of this.actions) {
            const value = this.qTable[nextStateKey][a] || 0;
            if (value > maxNextQ) {
                maxNextQ = value;
            }
        }

        // Q-learning update
        const currentQ = this.qTable[stateKey][action];
        const newQ = currentQ + this.alpha * (reward + this.gamma * maxNextQ - currentQ);
        this.qTable[stateKey][action] = newQ;

        return newQ;
    }
}