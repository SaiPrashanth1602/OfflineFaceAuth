import { calculateEAR, isBlinking } from './blinkDetector';
import { detectHeadDirection } from './headPose';
import { checkLiveness } from './livenessEngine';
import { LivenessStateMachine } from './livenessStateMachine';

console.log("===== BLINK TEST =====");

const ear = calculateEAR(40, 2, 2);

console.log("EAR:", ear);
console.log("Blink:", isBlinking(ear));

console.log("\n===== HEAD POSE TEST =====");

console.log(
  detectHeadDirection(260, 200)
);

console.log("\n===== LIVENESS TEST =====");

console.log(
  checkLiveness({
    blinkPassed: true,
    headTurnPassed: true,
  })
);

console.log("\n===== STATE MACHINE TEST =====");

const machine = new LivenessStateMachine();

console.log(machine.getStage());

machine.issueChallenge();
console.log(machine.getStage());

machine.waiting();
console.log(machine.getStage());

machine.pass();
console.log(machine.getStage());