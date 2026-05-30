export interface LivenessState {
  blinkPassed: boolean;
  headTurnPassed: boolean;
}

export function checkLiveness(
  state: LivenessState
): boolean {

  return (
    state.blinkPassed &&
    state.headTurnPassed
  );
}