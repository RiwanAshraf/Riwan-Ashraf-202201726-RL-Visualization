// environments/MountainCar.js
export default class MountainCar {
    constructor() {
        this.minPos = -1.2;
        this.maxPos = 0.6;
        this.goalPos = 0.5;
        this.minVel = -0.07;
        this.maxVel = 0.07;
        this.actions = ['left', 'none', 'right'];

        // Coarser discretization for faster learning
        this.posBins = 10;  // Reduced for faster learning
        this.velBins = 10;
        
        this.reset();
    }

    reset() {
        this.position = -0.5; // Fixed start (easier than random)
        this.velocity = 0;
        this.isDone = false;
        this.steps = 0;
        return this.getState();
    }

    getState() {
        // Normalize to [0, 1]
        const posNorm = (this.position - this.minPos) / (this.maxPos - this.minPos);
        const velNorm = (this.velocity - this.minVel) / (this.maxVel - this.minVel);
        
        // Discretize
        const posBin = Math.floor(Math.max(0, Math.min(0.999, posNorm)) * this.posBins);
        const velBin = Math.floor(Math.max(0, Math.min(0.999, velNorm)) * this.velBins);
        
        // Return as object to be consistent with other environments
        return { x: posBin, y: velBin };
    }

    step(action) {
        if (this.isDone) {
            return { nextState: this.getState(), reward: 0 };
        }

        this.steps++;
        
        // Apply action
        let force = 0;
        if (action === 'left') force = -1;
        else if (action === 'right') force = 1;

        // Physics
        this.velocity += 0.001 * force - 0.0025 * Math.cos(3 * this.position);
        this.velocity = Math.max(this.minVel, Math.min(this.maxVel, this.velocity));
        this.position += this.velocity;

        // Left boundary
        if (this.position < this.minPos) {
            this.position = this.minPos;
            this.velocity = 0;
        }

        // Reward shaping - CRITICAL FOR LEARNING
        let reward = -1; // Base penalty per step
        
        // Bonus for velocity to the right (toward goal)
        if (this.velocity > 0) {
            reward += 0.5;
        }
        
        // Bonus for higher position
        reward += this.position * 2;
        
        // Check if goal reached
        if (this.position >= this.goalPos) {
            this.isDone = true;
            reward = 100; // Large success reward
            console.log(`Goal reached in ${this.steps} steps!`);
        }
        
        // Timeout penalty
        if (this.steps >= 200) {
            this.isDone = true;
            reward = -50; // Penalty for timeout
        }

        return { nextState: this.getState(), reward };
    }

    render(ctx) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        const w = ctx.canvas.width;
        const h = ctx.canvas.height;

        // Draw hill
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < w; i++) {
            const xNorm = i / w;
            const x = this.minPos + xNorm * (this.maxPos - this.minPos);
            const y = Math.sin(3 * x);
            ctx.lineTo(i, h / 2 - y * 50);
        }
        ctx.stroke();

        // Draw goal flag
        const goalX = ((this.goalPos - this.minPos) / (this.maxPos - this.minPos)) * w;
        const goalY = h / 2 - Math.sin(3 * this.goalPos) * 50;
        
        // Flag pole
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(goalX, goalY - 30);
        ctx.lineTo(goalX, goalY - 5);
        ctx.stroke();
        
        // Flag
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.moveTo(goalX, goalY - 30);
        ctx.lineTo(goalX + 15, goalY - 22);
        ctx.lineTo(goalX, goalY - 14);
        ctx.closePath();
        ctx.fill();

        // Draw car
        const carX = ((this.position - this.minPos) / (this.maxPos - this.minPos)) * w;
        const carY = h / 2 - Math.sin(3 * this.position) * 50;
        
        // Car body
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(carX, carY - 10, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Car highlight
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(carX - 4, carY - 13, 4, 0, Math.PI * 2);
        ctx.fill();
    }
}