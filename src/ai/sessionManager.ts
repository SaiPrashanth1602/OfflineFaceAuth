export type SessionChallenge = 'BLINK' | 'HEAD_TURN' | 'SMILE';
export type SessionStatus = 'PENDING' | 'PASSED' | 'FAILED';

export interface Session {
  challenge: SessionChallenge;
  startedAt: number;
  attempts: number;
  status: SessionStatus;
}

export const session: Session = {
  challenge: 'BLINK',
  startedAt: Date.now(),
  attempts: 1,
  status: 'PASSED',
};   