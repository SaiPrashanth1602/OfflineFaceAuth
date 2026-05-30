import { checkLiveness } from './livenessEngine';

console.log(
  checkLiveness({
    blinkPassed: true,
    headTurnPassed: true,
  })
);