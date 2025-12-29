// environments/FrozenLake.js
export default class FrozenLake {
    constructor(slippery = true) {
        this.size = 4;
        this.slippery = slippery;

        this.map = [
            ['S', 'F', 'H', 'F'],
            ['F', 'F', 'F', 'H'],
            ['F', 'F', 'F', 'H'],
            ['H', 'F', 'F', 'G'],
        ];

        this.actions = ['left', 'down', 'right', 'up'];
        
        // For consistent state representation with other envs
        this.useObjectState = true; // Set to true to match GridWorld format

        this.reset();
    }

    reset() {
        this.agentPos = { x: 0, y: 0 };
        this.isDone = false;
        return this.getState();
    }

    getState() {
        // Return in same format as GridWorld for consistency
        return { x: this.agentPos.x, y: this.agentPos.y };
    }

    step(action) {
        if (this.isDone) {
            return { nextState: this.getState(), reward: 0 };
        }

        // --- Gym-style slippery ---
        if (this.slippery) {
            const prob = Math.random();
            const intendedProb = 0.8;
            
            if (prob > intendedProb) {
                // pick one of the other 3 actions randomly
                const otherActions = this.actions.filter(a => a !== action);
                const idx = Math.floor(Math.random() * 3);
                action = otherActions[idx];
            }
        }

        let { x, y } = this.agentPos;

        switch (action) {
            case 'left': x = Math.max(0, x - 1); break;
            case 'right': x = Math.min(this.size - 1, x + 1); break;
            case 'up': y = Math.max(0, y - 1); break;
            case 'down': y = Math.min(this.size - 1, y + 1); break;
        }

        this.agentPos = { x, y };

        const tile = this.map[y][x];

        let reward = -0.001;
        
        if (tile === 'H') {
            reward = -1;
            this.isDone = true;
        } else if (tile === 'G') {
            reward = 1;
            this.isDone = true;
        }

        return {
            nextState: this.getState(),
            reward
        };
    }

    render(ctx) {
        const cellSize = ctx.canvas.width / this.size;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                const tile = this.map[y][x];

                switch (tile) {
                    case 'S':
                        ctx.fillStyle = '#a0e0ff'; break; // Start - light blue
                    case 'F':
                        ctx.fillStyle = '#dbeafe'; break; // Frozen - very light blue
                    case 'H':
                        ctx.fillStyle = '#4b5563'; break; // Hole - dark gray
                    case 'G':
                        ctx.fillStyle = '#10b981'; break; // Goal - green
                }

                ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                
                // Draw grid
                ctx.strokeStyle = '#94a3b8';
                ctx.lineWidth = 1;
                ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
                
                // Draw tile type indicator
                if (tile === 'H' || tile === 'G') {
                    ctx.fillStyle = 'white';
                    ctx.font = 'bold 14px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(
                        tile,
                        x * cellSize + cellSize / 2,
                        y * cellSize + cellSize / 2
                    );
                }
            }
        }

        // Draw agent
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(
            this.agentPos.x * cellSize + cellSize / 2,
            this.agentPos.y * cellSize + cellSize / 2,
            cellSize / 3,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // Agent highlight
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(
            this.agentPos.x * cellSize + cellSize / 2 - 3,
            this.agentPos.y * cellSize + cellSize / 2 - 3,
            cellSize / 6,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }
}