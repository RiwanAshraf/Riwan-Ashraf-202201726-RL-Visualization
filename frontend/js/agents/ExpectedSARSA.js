// agents/ExpectedSARSA.js
import Agent from "../core/agent.js";

export default class ExpectedSARSA extends Agent {
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

    getStateKey(state) {
        if (typeof state === 'string') return state;
        if (state && state.x !== undefined && state.y !== undefined) {
            return `${state.x},${state.y}`;
        }
        if (state && state.position !== undefined && state.velocity !== undefined) {
            const pos = Math.round(state.position * 10);
            const vel = Math.round(state.velocity * 10);
            return `${pos},${vel}`;
        }
        return JSON.stringify(state);
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

        if (!this.qTable[stateKey]) {
            this.qTable[stateKey] = {};
            this.actions.forEach(action => {
                this.qTable[stateKey][action] = 0;
            });
            
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

        // Calculate expected value for next state
        let expectedValue = 0;
        
        // Find greedy action for probability calculation
        let bestActions = [];
        let bestValue = -Infinity;
        
        for (const a of this.actions) {
            const value = this.qTable[nextStateKey][a] || 0;
            if (value > bestValue) {
                bestValue = value;
                bestActions = [a];
            } else if (value === bestValue) {
                bestActions.push(a);
            }
        }
        
        // Calculate probabilities for epsilon-greedy policy
        const greedyProbability = (1 - this.epsilon) + (this.epsilon / this.actions.length);
        const nonGreedyProbability = this.epsilon / this.actions.length;
        
        // Calculate expected value
        for (const a of this.actions) {
            const qValue = this.qTable[nextStateKey][a] || 0;
            let probability;
            
            if (bestActions.includes(a)) {
                // This is one of the greedy actions
                probability = greedyProbability / bestActions.length;
            } else {
                probability = nonGreedyProbability;
            }
            
            expectedValue += probability * qValue;
        }

        // Expected SARSA update
        const currentQ = this.qTable[stateKey][action];
        const newQ = currentQ + this.alpha * (reward + this.gamma * expectedValue - currentQ);
        this.qTable[stateKey][action] = newQ;

        return newQ;
    }
}