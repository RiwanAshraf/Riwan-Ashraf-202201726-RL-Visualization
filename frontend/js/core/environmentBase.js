export default class EnvironmentBase {
    reset() {
        throw new Error("reset() not implemented");
    }

    step(action) {
        throw new Error("step() not implemented");
    }

    render(ctx) {
        throw new Error("render() not implemented");
    }

    getState() {
        throw new Error("getState() not implemented");
    }

    getActions() {
        throw new Error("getActions() not implemented");
    }
}
