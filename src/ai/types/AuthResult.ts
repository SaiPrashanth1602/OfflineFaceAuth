export interface AuthResult {
  userId: string;
  confidence: number;
  liveness: boolean;
  status: string;
  timestamp: string;
}