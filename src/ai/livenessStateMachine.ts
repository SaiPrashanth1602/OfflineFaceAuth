export type LivenessStage =
  | "IDLE"
  | "CHALLENGE_ISSUED"
  | "WAITING_FOR_RESPONSE"
  | "PASSED"
  | "FAILED";

export class LivenessStateMachine {
  private stage: LivenessStage = "IDLE";

  issueChallenge() {
    this.stage = "CHALLENGE_ISSUED";
  }

  waiting() {
    this.stage = "WAITING_FOR_RESPONSE";
  }

  pass() {
    this.stage = "PASSED";
  }

  fail() {
    this.stage = "FAILED";
  }

  getStage() {
    return this.stage;
  }
}