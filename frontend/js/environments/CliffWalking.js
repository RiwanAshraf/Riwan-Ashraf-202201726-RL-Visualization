export default class CliffWalking {
    constructor(rows = 4, cols = 12) {
        this.rows = rows;
        this.cols = cols;

        this.start = { x: 0, y: rows - 1 };
        this.goal = { x: cols - 1, y: rows - 1 };

        this.reset();
    }

    reset() {
        this.agentPos = { ...this.start };
        this.isDone = false;
        return this.getState();
    }

    getState() {
        return this.agentPos;
    }

    get size() {
        return Math.max(this.rows, this.cols);
    }

    isCliff(x, y) {
        return (
            y === this.rows - 1 &&
            x > this.start.x &&
            x < this.goal.x
        );
    }

    // In CliffWalking.js - simplify step() method
    step(action) {
        if (this.isDone) {
            return { nextState: this.getState(), reward: 0 };
        }

        let { x, y } = this.agentPos;

        switch (action) {
            case 'up': y--; break;
            case 'down': y++; break;
            case 'left': x--; break;
            case 'right': x++; break;
        }

        // Stay inside grid
        x = Math.max(0, Math.min(this.cols - 1, x));
        y = Math.max(0, Math.min(this.rows - 1, y));

        let reward = -1;

        // Check if fell off cliff
        if (this.isCliff(x, y)) {
            reward = -100;
            // Teleport back to start
            this.agentPos = { ...this.start };
            this.isDone = true; // Episode ends when falling off cliff
            return { nextState: this.getState(), reward };
        }

        this.agentPos = { x, y };

        // Check if reached goal
        if (x === this.goal.x && y === this.goal.y) {
            reward = 0;
            this.isDone = true;
        }

        return { nextState: this.getState(), reward }; // SIMPLIFIED: Just return what other envs return
    }
    isTerminalState(state) {
        // A state is terminal if it's the goal OR if it's a cliff tile
        // (even though agent never stays on cliff, it's terminal for planning)
        return (state.x === this.goal.x && state.y === this.goal.y) ||
            this.isCliff(state.x, state.y);
    }

    render(ctx) {
        const cellSize = ctx.canvas.width / this.cols;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                // Cliff
                if (this.isCliff(x, y)) {
                    ctx.fillStyle = '#ef4444';
                }
                // Goal
                else if (x === this.goal.x && y === this.goal.y) {
                    ctx.fillStyle = '#22c55e';
                }
                // Start
                else if (x === this.start.x && y === this.start.y) {
                    ctx.fillStyle = '#3b82f6';
                }
                else {
                    ctx.fillStyle = '#f3f4f6';
                }

                ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                ctx.strokeStyle = '#d1d5db';
                ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);

                // Draw labels
                ctx.fillStyle = 'white';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                if (this.isCliff(x, y)) {
                    ctx.fillText('💀', x * cellSize + cellSize / 2, y * cellSize + cellSize / 2);
                } else if (x === this.goal.x && y === this.goal.y) {
                    ctx.fillText('🏁', x * cellSize + cellSize / 2, y * cellSize + cellSize / 2);
                } else if (x === this.start.x && y === this.start.y) {
                    ctx.fillText('🚶', x * cellSize + cellSize / 2, y * cellSize + cellSize / 2);
                }
            }
        }

        // Draw agent
        ctx.fillStyle = '#111827';
        ctx.beginPath();
        ctx.arc(
            this.agentPos.x * cellSize + cellSize / 2,
            this.agentPos.y * cellSize + cellSize / 2,
            cellSize / 4,
            0,
            Math.PI * 2
        );
        ctx.fill();

        // Draw agent eyes
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(
            this.agentPos.x * cellSize + cellSize / 2 - 5,
            this.agentPos.y * cellSize + cellSize / 2 - 5,
            cellSize / 16,
            0,
            Math.PI * 2
        );
        ctx.fill();
        ctx.beginPath();
        ctx.arc(
            this.agentPos.x * cellSize + cellSize / 2 + 5,
            this.agentPos.y * cellSize + cellSize / 2 - 5,
            cellSize / 16,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }
}