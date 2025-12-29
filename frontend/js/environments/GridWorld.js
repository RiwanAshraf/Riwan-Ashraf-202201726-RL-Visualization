// environments/GridWorld.js
import EnvironmentBase from "../core/environmentBase.js";
export default class GridWorld extends EnvironmentBase{
    constructor(size = 10) {
        super();
        this.size = size;
        this.agentShape = "cutefrog"; // default: "circle" | "square" | "cutefrog"
        this.agentImage = new Image();
        this.agentImage.src = "./CuteFrog.png"; // path to your PNG
        this.reset();
    }

    setAgentShape(shape) {
        this.agentShape = shape; // "circle", "square", "cutefrog"
    }


    reset() {
        this.state = { x: 0, y: 0 };
        this.goal = { x: this.size - 1, y: this.size - 1 };
        this.isDone = false;
        return this.state;
    }

    step(action) {
        if (this.isDone) {
            return { nextState: this.state, reward: 0, done: true };
        }

        let { x, y } = this.state;

        if (action === "up") y--;
        else if (action === "down") y++;
        else if (action === "left") x--;
        else if (action === "right") x++;

        x = Math.max(0, Math.min(this.size - 1, x));
        y = Math.max(0, Math.min(this.size - 1, y));

        this.state = { x, y };
        this.isDone = (x === this.goal.x && y === this.goal.y);

        const reward = this.isDone ? 100 : -1;
        return { nextState: this.state, reward, done: this.isDone };
    }

    render(ctx) {
    const cellSize = 60;
    const canvasSize = this.size * cellSize;

    // Clear canvas
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Draw grid background
    for (let i = 0; i < this.size; i++) {
        for (let j = 0; j < this.size; j++) {
            ctx.fillStyle = (i + j) % 2 === 0 ? "#f8f9fa" : "#ffffff";
            ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
        }
    }

    // Draw grid lines
    ctx.strokeStyle = "#dee2e6";
    ctx.lineWidth = 1;
    for (let i = 0; i <= this.size; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, canvasSize);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(canvasSize, i * cellSize);
        ctx.stroke();
    }

    // Draw goal
    ctx.fillStyle = "#6366f1";
    ctx.fillRect(
        this.goal.x * cellSize + 5,
        this.goal.y * cellSize + 5,
        cellSize - 10,
        cellSize - 10
    );

    // Draw agent
    const agentX = this.state.x * cellSize + cellSize / 2;
    const agentY = this.state.y * cellSize + cellSize / 2;
    const agentRadius = cellSize / 3;

    switch (this.agentShape) {
        case "circle":
            ctx.fillStyle = "#f59e0b";
            ctx.beginPath();
            ctx.arc(agentX, agentY, agentRadius, 0, Math.PI * 2);
            ctx.fill();
            break;

        case "square":
            ctx.fillStyle = "#f59e0b";
            ctx.fillRect(
                this.state.x * cellSize + cellSize / 6,
                this.state.y * cellSize + cellSize / 6,
                cellSize / 1.5,
                cellSize / 1.5
            );
            break;

        case "cutefrog":
            if (this.agentImage.complete && this.agentImage.naturalHeight !== 0) {
                ctx.drawImage(
                    this.agentImage,
                    this.state.x * cellSize,
                    this.state.y * cellSize,
                    cellSize,
                    cellSize
                );
            } else {
                // if image not loaded yet, just draw circle temporarily
                ctx.fillStyle = "#f59e0b";
                ctx.beginPath();
                ctx.arc(agentX, agentY, agentRadius, 0, Math.PI * 2);
                ctx.fill();

                // force re-render when image loads
                this.agentImage.onload = () => {
                    this.render(ctx);
                };
            }
            break;
    }

    // Draw labels (optional, e.g., goal)
    ctx.fillStyle = "white";
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("G", this.goal.x * cellSize + cellSize / 2, this.goal.y * cellSize + cellSize / 2);
}



getActions() { 
    return ['up','down','left','right']; 
}

}