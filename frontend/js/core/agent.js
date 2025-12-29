// core/agent.js
export default class Agent {
    constructor(actions) {
        this.actions = actions;
    }
    
    act(state) {
        // Base implementation returns random action
        return this.actions[Math.floor(Math.random() * this.actions.length)];
    }
    
    learn(state, action, reward, nextState) {
        // Base implementation does nothing
    }
}