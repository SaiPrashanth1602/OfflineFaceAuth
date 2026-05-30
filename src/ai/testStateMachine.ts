import { LivenessStateMachine } from "./livenessStateMachine";

const machine = new LivenessStateMachine();

console.log(machine.getStage());

machine.issueChallenge();
console.log(machine.getStage());

machine.waiting();
console.log(machine.getStage());

machine.pass();
console.log(machine.getStage());