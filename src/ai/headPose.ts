export type HeadDirection =
  | 'LEFT'
  | 'RIGHT'
  | 'CENTER';

export function detectHeadDirection(
  noseX: number,
  faceCenterX: number
): HeadDirection {

  const diff = noseX - faceCenterX;

  if (diff > 30) {
    return 'RIGHT';
  }

  if (diff < -30) {
    return 'LEFT';
  }

  return 'CENTER';
}