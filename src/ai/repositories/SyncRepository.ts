import { getDB } from '../database/db';
import { SyncItem } from '../types/SyncItem';

/**
 * SyncRepository handles queue management inside the local SQLite database.
 * It implements the Outbox Pattern to ensure data consistency in offline environments.
 */
export class SyncRepository {
  /**
   * Adds a new task/payload to the local synchronization queue.
   * By default, it is inserted with the 'pending' status.
   * 
   * @param payload A serialized JSON string containing details of the action (e.g., auth log, user updates).
   */
  static async enqueue(payload: string): Promise<void> {
    try {
      const db = getDB();
      // Generate a unique identifier for this queue transaction
      const syncId = `sync_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const createdAt = new Date().toISOString();
      const defaultStatus = 'pending';

      console.log(`[SyncRepository] Enqueuing payload: ${syncId}`);

      await db.executeSql(
        'INSERT INTO sync_queue (id, payload, status, createdAt) VALUES (?, ?, ?, ?)',
        [syncId, payload, defaultStatus, createdAt]
      );
    } catch (error) {
      console.error('[SyncRepository] Error enqueuing item:', error);
      throw error;
    }
  }

  /**
   * Retrieves all queue items that have not yet been successfully synced (both 'pending' and 'failed').
   * Ordered by creation time so that sync events are processed in correct chronological order (FIFO).
   * 
   * @returns An array of SyncItem objects.
   */
  static async getPendingItems(): Promise<SyncItem[]> {
    try {
      const db = getDB();
      console.log('[SyncRepository] Fetching pending/failed synchronization items...');

      // Fetch items that are pending or failed to retry them, ordered oldest first to preserve transaction order
      const [result] = await db.executeSql(
        "SELECT id, payload, status, createdAt FROM sync_queue WHERE status = 'pending' OR status = 'failed' ORDER BY createdAt ASC"
      );

      const items: SyncItem[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        const item = result.rows.item(i);
        items.push({
          id: item.id,
          payload: item.payload,
          status: item.status as 'pending' | 'synced' | 'failed',
          createdAt: item.createdAt,
        });
      }

      console.log(`[SyncRepository] Loaded ${items.length} sync queue items to process`);
      return items;
    } catch (error) {
      console.error('[SyncRepository] Error fetching pending sync items:', error);
      throw error;
    }
  }

  /**
   * Marks a queue item as successfully synchronized.
   * 
   * @param id The unique identifier of the sync queue item.
   */
  static async markSynced(id: string): Promise<void> {
    try {
      const db = getDB();
      console.log(`[SyncRepository] Marking item ${id} as synced`);

      await db.executeSql(
        "UPDATE sync_queue SET status = 'synced' WHERE id = ?",
        [id]
      );
    } catch (error) {
      console.error(`[SyncRepository] Error marking item ${id} as synced:`, error);
      throw error;
    }
  }

  /**
   * Marks a queue item as failed so it can be retried in the next batch cycle.
   * Helpful for debugging and selective retry logic.
   * 
   * @param id The unique identifier of the sync queue item.
   */
  static async markFailed(id: string): Promise<void> {
    try {
      const db = getDB();
      console.log(`[SyncRepository] Marking item ${id} as failed`);

      await db.executeSql(
        "UPDATE sync_queue SET status = 'failed' WHERE id = ?",
        [id]
      );
    } catch (error) {
      console.error(`[SyncRepository] Error marking item ${id} as failed:`, error);
      throw error;
    }
  }

  /**
   * Deletes all successfully synchronized items from the queue to free up device storage.
   */
  static async clearSynced(): Promise<void> {
    try {
      const db = getDB();
      console.log('[SyncRepository] Cleaning up successfully synced queue items...');

      const [result] = await db.executeSql("DELETE FROM sync_queue WHERE status = 'synced'");
      console.log(`[SyncRepository] Successfully removed synced queue items`);
    } catch (error) {
      console.error('[SyncRepository] Error clearing synced items:', error);
      throw error;
    }
  }
}
