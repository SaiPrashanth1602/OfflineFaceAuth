import { SyncRepository } from '../repositories/SyncRepository';
import { SyncItem } from '../types/SyncItem';

/**
 * Interface representing the sync processing report summary.
 */
export interface SyncReport {
  totalProcessed: number;
  succeededCount: number;
  failedCount: number;
  logs: string[];
}

/**
 * SyncService implements a lightweight, robust Outbox Pattern for synchronization.
 * It processes items in the SQLite-backed queue sequentially, simulating network latency,
 * successes, and failures to replicate offline-to-online recovery states.
 * 
 * Includes a processing lock to prevent race conditions during concurrent triggers.
 */
export class SyncService {
  // Configurable simulated success rate (0.0 to 1.0)
  private static successProbability = 0.85;
  // Lock flag to prevent concurrent synchronization cycles (Race Condition Guard)
  private static isProcessing = false;

  /**
   * Helper utility to pause execution, simulating network round-trip time.
   */
  private static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Mock API request simulating data upload to a centralized authentication server.
   * 
   * @param item The queue item being synchronized.
   * @param forceSuccess Optional parameter to force API upload success for demo purposes.
   * @param forceFailure Optional parameter to force API upload failure for demo purposes.
   */
  private static async mockApiUpload(
    item: SyncItem,
    forceSuccess?: boolean,
    forceFailure?: boolean
  ): Promise<{ success: boolean; message: string }> {
    // Simulate real-world network latency (800ms - 1500ms)
    const latency = Math.floor(Math.random() * 700) + 800;
    await this.delay(latency);

    if (forceFailure) {
      return { success: false, message: 'Simulated API Upload Failure (Forced)' };
    }

    if (forceSuccess) {
      return { success: true, message: 'Simulated API Upload Success (Forced)' };
    }

    // Determine outcome based on success probability
    const isSuccessful = Math.random() < this.successProbability;

    if (isSuccessful) {
      return { success: true, message: 'API upload successful' };
    } else {
      return { success: false, message: 'Network request timed out / Server unreachable' };
    }
  }

  /**
   * Processes all pending and failed items currently stored in the SQLite synchronization queue.
   * 
   * @param options Optional parameters to control simulation outcomes (ideal for live hackathon presentations).
   * @returns A SyncReport summarizing the synchronization outcome.
   */
  static async processPendingItems(options?: {
    forceSuccess?: boolean;
    forceFailure?: boolean;
  }): Promise<SyncReport> {
    const report: SyncReport = {
      totalProcessed: 0,
      succeededCount: 0,
      failedCount: 0,
      logs: [],
    };

    const addLog = (msg: string) => {
      const timestamp = new Date().toLocaleTimeString();
      const formattedMsg = `[SyncService][${timestamp}] ${msg}`;
      console.log(formattedMsg);
      report.logs.push(formattedMsg);
    };

    // Prevent concurrent sync executions (Race Condition Guard)
    if (this.isProcessing) {
      addLog('Synchronization already in progress. Skipping duplicate execution...');
      return report;
    }

    this.isProcessing = true;
    addLog('Starting synchronization process...');

    try {
      // 1. Retrieve items that need syncing (pending or previously failed)
      const pendingItems = await SyncRepository.getPendingItems();

      if (pendingItems.length === 0) {
        addLog('Sync completed: Queue is already empty. Nothing to synchronize.');
        return report;
      }

      addLog(`Found ${pendingItems.length} item(s) in queue. Syncing now...`);

      // 2. Process each item sequentially in FIFO order
      for (const item of pendingItems) {
        report.totalProcessed++;
        addLog(`Syncing item ${item.id} (Status: ${item.status}, Created: ${item.createdAt})...`);

        try {
          // Parse payload just to log/preview details nicely
          const parsedPayload = JSON.parse(item.payload);
          addLog(`Payload action: ${parsedPayload.action || 'Unknown Event'}`);
        } catch {
          addLog(`Raw Payload: ${item.payload.substring(0, 60)}...`);
        }

        // Simulate API call
        const apiResponse = await this.mockApiUpload(
          item,
          options?.forceSuccess,
          options?.forceFailure
        );

        if (apiResponse.success) {
          addLog(`Success: Item ${item.id} successfully uploaded to API.`);
          await SyncRepository.markSynced(item.id);
          report.succeededCount++;
        } else {
          addLog(`Failure: Item ${item.id} upload failed. Error: ${apiResponse.message}`);
          await SyncRepository.markFailed(item.id);
          report.failedCount++;
        }
      }

      // 3. Cleanup synced items to conserve local disk storage
      addLog('Cleaning up successfully synced items from database...');
      await SyncRepository.clearSynced();
      addLog('Cleanup finished.');

      addLog(
        `Sync Process finished. Summary: Total=${report.totalProcessed}, Succeeded=${report.succeededCount}, Failed=${report.failedCount}`
      );
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      addLog(`CRITICAL ERROR during sync execution: ${errMsg}`);
    } finally {
      this.isProcessing = false; // Always release the lock
    }

    return report;
  }

  /**
   * Dynamically alters the success probability of mock API requests.
   * Useful for testing offline-online recovery states on the fly.
   * 
   * @param probability Value between 0.0 (always fail) and 1.0 (always succeed)
   */
  static setMockSuccessRate(probability: number) {
    if (probability >= 0 && probability <= 1) {
      this.successProbability = probability;
      console.log(`[SyncService] Mock API success probability set to: ${probability * 100}%`);
    }
  }

  /**
   * Queries whether synchronization is currently active.
   */
  static isSyncActive(): boolean {
    return this.isProcessing;
  }
}
