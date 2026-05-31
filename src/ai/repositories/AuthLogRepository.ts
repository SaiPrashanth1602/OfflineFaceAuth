import { getDB } from '../database/db';
import { AuthResult } from '../types/AuthResult';

export interface AuthLog extends AuthResult {
  id: string;
}

/**
 * AuthLogRepository handles logging of face authentication events.
 * It maps high-level AuthResult objects (booleans) to low-level SQLite types (integers for liveness).
 */
export class AuthLogRepository {
  /**
   * Saves a new authentication attempt log to the local SQLite database.
   * Automatically generates a unique ID for the log entry.
   * 
   * @param log The authentication result containing userId, confidence, liveness status, and timestamp.
   */
  static async saveAuthLog(log: AuthResult): Promise<void> {
    try {
      const db = getDB();
      // Generate a lightweight unique ID for the log record (Hackathon & Offline-friendly)
      const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      console.log(`[AuthLogRepository] Saving log ${logId} for user ${log.userId}`);

      // Map boolean liveness to SQLite INTEGER (0 or 1)
      const livenessInt = log.liveness ? 1 : 0;

      await db.executeSql(
        `INSERT INTO auth_logs (id, userId, confidence, liveness, status, timestamp) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [logId, log.userId, log.confidence, livenessInt, log.status, log.timestamp]
      );
    } catch (error) {
      console.error('[AuthLogRepository] Error saving auth log:', error);
      throw error;
    }
  }

  /**
   * Retrieves all saved authentication logs, ordered by timestamp in descending order (newest first).
   * Maps SQLite integer fields back to their corresponding TypeScript types (e.g. converting 1/0 back to true/false for liveness).
   * 
   * @returns An array of AuthLog objects containing the generated database ID.
   */
  static async getAuthLogs(): Promise<AuthLog[]> {
    try {
      const db = getDB();
      console.log('[AuthLogRepository] Retrieving authentication logs...');

      const [result] = await db.executeSql(
        'SELECT id, userId, confidence, liveness, status, timestamp FROM auth_logs ORDER BY timestamp DESC'
      );

      const logs: AuthLog[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        const item = result.rows.item(i);
        logs.push({
          id: item.id,
          userId: item.userId,
          confidence: item.confidence,
          // Map SQLite INTEGER (0 or 1) back to TypeScript boolean
          liveness: item.liveness === 1,
          status: item.status,
          timestamp: item.timestamp,
        });
      }

      console.log(`[AuthLogRepository] Successfully loaded ${logs.length} logs`);
      return logs;
    } catch (error) {
      console.error('[AuthLogRepository] Error retrieving auth logs:', error);
      throw error;
    }
  }

  /**
   * Clears all local authentication logs to save storage space on the device.
   */
  static async clearLogs(): Promise<void> {
    try {
      const db = getDB();
      console.log('[AuthLogRepository] Clearing all local authentication logs...');

      await db.executeSql('DELETE FROM auth_logs');
      console.log('[AuthLogRepository] Successfully cleared all authentication logs');
    } catch (error) {
      console.error('[AuthLogRepository] Error clearing auth logs:', error);
      throw error;
    }
  }
}
