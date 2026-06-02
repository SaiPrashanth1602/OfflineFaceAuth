export class BlinkDetector {
  private wasClosed = false;

  detect(ear: number): boolean {
    const closed = ear < 0.2;

    if (closed) {
      this.wasClosed = true;
      return false;
    }

    if (!closed && this.wasClosed) {
      this.wasClosed = false;
      return true;
    }

    return false;
  }

  reset() {
    this.wasClosed = false;
  }
}

export function calculateEAR(
  eyeWidth: number,
  eyeHeight: number,
  eyeDistance: number,
): number {
  if (eyeWidth <= 0) {
    return 0;
  }

  return (eyeHeight * 2) / (eyeWidth + eyeDistance);
}

export function isBlinking(ear: number): boolean {
  return ear < 0.22;
}