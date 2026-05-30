export const CHALLENGES = [
  "BLINK",
  "TURN_LEFT",
  "TURN_RIGHT"
] as const;

export function generateChallenge() {
  const index = Math.floor(
    Math.random() * CHALLENGES.length
  );

  return CHALLENGES[index];
}