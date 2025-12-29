// core/loop.js

import SARSA from "../agents/SARSA.js";
import QLearning from "../agents/QLearning.js";
// core/loop.js - UNIVERSAL VERSION
// core/loop.js - UNIVERSAL COMPATIBLE VERSION
export default class Loop {
    constructor(env, agent, ctx) {
        this.env = env;
        this.agent = agent;
        this.ctx = ctx;
        this.steps = 0;
        this.totalReward = 0;
        this.episodes = 0;
        this.successes = 0;
    }

    // Update environment (for when switching environments)
    updateEnvironment(newEnv) {
        this.env = newEnv;
        this.reset();
    }

    reset() {
        // Universal reset - try all possible reset methods
        if (typeof this.env.reset === 'function') {
            this.env.reset();
        }
        this.steps = 0;
        this.totalReward = 0;
        
        // Render if available
        if (typeof this.env.render === 'function') {
            this.env.render(this.ctx);
        }
        
        this.updateStats();
    }

    step() {
        try {
            // 1. GET CURRENT STATE (works for all environments)
            let state;
            
            // Try GridWorld/FrozenLake style (has .state property)
            if (this.env.state !== undefined) {
                state = this.env.state;
            }
            // Try getState() method (FrozenLake, CliffWalking)
            else if (typeof this.env.getState === 'function') {
                state = this.env.getState();
            }
            // Try agentPos (CliffWalking backup)
            else if (this.env.agentPos !== undefined) {
                state = this.env.agentPos;
            }
            // Default - use whatever reset returned
            else {
                state = {};
            }
            
            // 2. GET ACTION
            const action = this.agent.act(state);
            
            // 3. TAKE STEP
            const stepResult = this.env.step(action);
            
            // Extract results (handles all formats)
            const nextState = stepResult.nextState || stepResult.state || state;
            const reward = stepResult.reward || 0;
            
            // 4. LEARN
            let qValue = 0;
            
            // Check if agent is SARSA (needs nextAction)
            const isSARSA = this.agent.constructor.name === 'SARSA';
            
            if (isSARSA) {
                const nextAction = this.agent.act(nextState);
                qValue = this.agent.learn(state, action, reward, nextState, nextAction);
            } else {
                // Q-learning
                qValue = this.agent.learn(state, action, reward, nextState);
            }
            
            // 5. UPDATE COUNTERS
            this.steps++;
            this.totalReward += reward;
            
            // 6. RENDER
            if (typeof this.env.render === 'function') {
                this.env.render(this.ctx);
            }
            
            // 7. UPDATE UI
            this.updateUI(action, reward, qValue);
            
            // 8. CHECK IF DONE
            const isDone = this.checkIfDone(stepResult);
            
            if (isDone) {
                this.handleEpisodeEnd();
            }
            
        } catch (error) {
            console.error("Error in Loop.step():", error);
            // Reset to prevent getting stuck
            this.reset();
        }
    }
    
    updateUI(action, reward, qValue) {
        const elements = {
            "lastAction": action,
            "lastReward": reward.toFixed(2),
            "qValue": qValue.toFixed(3),
            "stepCount": this.steps,
            "totalReward": this.totalReward.toFixed(2)
        };
        
        for (const [id, value] of Object.entries(elements)) {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        }
    }
    
    checkIfDone(stepResult) {
        // Multiple ways to check if episode is done
        
        // 1. Environment has isDone property (FrozenLake, CliffWalking)
        if (this.env.isDone !== undefined) {
            return this.env.isDone;
        }
        
        // 2. Step result has done property (GridWorld, MountainCar)
        if (stepResult.done !== undefined) {
            return stepResult.done;
        }
        
        // 3. Check if environment has a terminal state checker
        if (typeof this.env.isTerminalState === 'function') {
            const state = this.env.getState ? this.env.getState() : this.env.state;
            return this.env.isTerminalState(state);
        }
        
        return false;
    }
    
    handleEpisodeEnd() {
        this.episodes++;
        
        // Calculate success
        let success = false;
        const envName = this.env.constructor ? this.env.constructor.name : 'Unknown';
        
        if (envName === 'GridWorld') {
            success = this.totalReward >= 0.9;
        } else if (envName === 'FrozenLake') {
            success = this.totalReward > 0.9;
        } else if (envName === 'CliffWalking') {
            success = this.totalReward >= -13;
        } else if (envName === 'MountainCar') {
            success = this.steps < 330;
        }
        
        if (success) {
            this.successes++;
        }
        
        // Update UI
        document.getElementById("episodeCount").textContent = this.episodes;
        
        const successRate = this.episodes > 0 ? 
            Math.round((this.successes / this.episodes) * 100) : 0;
        document.getElementById("successRate").textContent = successRate + "%";
        
        // Auto reset
        setTimeout(() => {
            this.reset();
        }, 1000);
    }
    
    updateStats() {
        document.getElementById("stepCount").textContent = this.steps;
        document.getElementById("totalReward").textContent = this.totalReward.toFixed(2);
        document.getElementById("episodeCount").textContent = this.episodes;
    }
}