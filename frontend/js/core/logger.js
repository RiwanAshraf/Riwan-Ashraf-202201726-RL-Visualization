// core/logger.js
export const learningLog = [];

export function logStep(data) {
    learningLog.push(data);
    console.log("Step:", data);
}