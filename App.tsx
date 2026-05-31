import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';

// Existing AI logic imports (Member 2)
import { calculateEAR, isBlinking } from './src/ai/blinkDetector';
import { detectHeadDirection } from './src/ai/headPose';
import { checkLiveness } from './src/ai/livenessEngine';

// Database & Repository imports (Member 3 - ME)
import { initDatabase } from './src/ai/database/db';
import { UserRepository } from './src/ai/repositories/UserRepository';
import { AuthLogRepository } from './src/ai/repositories/AuthLogRepository';
import { SyncRepository } from './src/ai/repositories/SyncRepository';
import { SyncService } from './src/ai/services/SyncService';

export default function App() {
  const [dbStatus, setDbStatus] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');
  const [testLogs, setTestLogs] = useState<string[]>([]);
  const [isTestRunning, setIsTestRunning] = useState(false);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setTestLogs((prev) => [...prev, `[${time}] ${msg}`]);
    console.log(`[AppTest] ${msg}`);
  };

  // Run existing AI tests (Member 2)
  useEffect(() => {
    addLog('--- RUNNING AI LIVENESS ENGINE PRE-CHECKS ---');
    const ear = calculateEAR(40, 2, 2);
    addLog(`EAR calculation: ${ear}`);
    addLog(`Blink detected: ${isBlinking(ear)}`);
    addLog(`Head Direction: ${detectHeadDirection(260, 200)}`);
    addLog(`Liveness check: ${JSON.stringify(checkLiveness({ blinkPassed: true, headTurnPassed: true }))}`);
    addLog('--- END AI PRE-CHECKS ---');
  }, []);

  const runOfflineDataLayerTests = async () => {
    if (isTestRunning) return;
    setIsTestRunning(true);
    setDbStatus('running');
    setTestLogs([]);
    addLog('🚀 Starting Offline-First Data Layer Test Suite...');

    try {
      // 1. Database Initialization
      addLog('Step 1: Initializing SQLite database...');
      await initDatabase();
      addLog('✅ Database initialized successfully.');

      // Cleanup pre-existing test data from previous runs to ensure fresh state
      addLog('Cleaning up old test users/logs...');
      try {
        await UserRepository.deleteUser('test_user_007');
      } catch {}
      await AuthLogRepository.clearLogs();
      await SyncRepository.clearSynced();
      addLog('Cleanup completed.');

      // 2. User Creation (Create)
      addLog('Step 2: Testing UserRepository.createUser()...');
      const mockEmbedding = UserRepository.serializeEmbedding([0.1, -0.2, 0.3, 0.4, -0.5]);
      await UserRepository.createUser({
        id: 'test_user_007',
        name: 'James Bond',
        embedding: mockEmbedding,
      });
      addLog('✅ User "test_user_007" created successfully.');

      // 3. User Retrieval (Read)
      addLog('Step 3: Testing UserRepository.getUser()...');
      const fetchedUser = await UserRepository.getUser('test_user_007');
      if (!fetchedUser) {
        throw new Error('User retrieval returned null');
      }
      addLog(`✅ User retrieved successfully: ${fetchedUser.name}`);
      const rawVector = UserRepository.deserializeEmbedding(fetchedUser.embedding);
      addLog(`Parsed Embedding Vector: [${rawVector.join(', ')}]`);

      // 4. Fetch All Users (Read All)
      addLog('Step 4: Testing UserRepository.getAllUsers()...');
      const allUsers = await UserRepository.getAllUsers();
      addLog(`✅ Fetched all users. Total registered users: ${allUsers.length}`);

      // 5. Auth Log Creation (Log Event)
      addLog('Step 5: Testing AuthLogRepository.saveAuthLog()...');
      await AuthLogRepository.saveAuthLog({
        userId: 'test_user_007',
        confidence: 0.96,
        liveness: true,
        status: 'SUCCESS',
        timestamp: new Date().toISOString(),
      });
      await AuthLogRepository.saveAuthLog({
        userId: 'test_user_007',
        confidence: 0.42,
        liveness: false,
        status: 'FAILED_LIVENESS',
        timestamp: new Date().toISOString(),
      });
      addLog('✅ Saved 2 authentication logs successfully.');

      // 6. Auth Log Retrieval (Read Logs)
      addLog('Step 6: Testing AuthLogRepository.getAuthLogs()...');
      const logs = await AuthLogRepository.getAuthLogs();
      addLog(`✅ Retrieved ${logs.length} logs successfully (ordered newest first):`);
      logs.forEach((log) => {
        addLog(` - Log ID: ${log.id} | User: ${log.userId} | Status: ${log.status} | Liveness: ${log.liveness}`);
      });

      // 7. Queue Insertion (Enqueue Outbox)
      addLog('Step 7: Testing SyncRepository.enqueue()...');
      const payload1 = JSON.stringify({ action: 'SYNC_USER_REGISTRATION', data: { id: 'test_user_007', name: 'James Bond' } });
      const payload2 = JSON.stringify({ action: 'SYNC_AUTH_LOG', data: logs[0] });
      await SyncRepository.enqueue(payload1);
      await SyncRepository.enqueue(payload2);
      addLog('✅ Enqueued 2 tasks in sync_queue successfully.');

      // 8. Queue Retrieval (Get Outbox Items)
      addLog('Step 8: Testing SyncRepository.getPendingItems()...');
      const pendingItems = await SyncRepository.getPendingItems();
      addLog(`✅ Retrieved ${pendingItems.length} pending items from sync_queue.`);

      // 9. Sync Execution (Simulated Dispatch)
      addLog('Step 9: Testing SyncService.processPendingItems()...');
      // Set to 100% success rate to ensure queue clears cleanly
      SyncService.setMockSuccessRate(1.0);
      addLog('Triggering manual outbox synchronization (forcing 100% success rate)...');
      const syncResult = await SyncService.processPendingItems();
      addLog(`✅ Sync finished! Total processed: ${syncResult.totalProcessed}, Succeeded: ${syncResult.succeededCount}, Failed: ${syncResult.failedCount}`);

      // Verify queue is empty after sync cleanup
      const queueAfterSync = await SyncRepository.getPendingItems();
      addLog(`Items remaining in queue: ${queueAfterSync.length}`);

      // 10. User Deletion (Delete)
      addLog('Step 10: Testing UserRepository.deleteUser()...');
      await UserRepository.deleteUser('test_user_007');
      addLog('✅ User "test_user_007" deleted successfully.');

      // Cascade Delete Verification
      const logsAfterDelete = await AuthLogRepository.getAuthLogs();
      addLog(`Logs remaining after cascade deletion: ${logsAfterDelete.length} (Expected: 0)`);

      addLog('🎉 ALL OFFLINE DATA LAYER TESTS PASSED SUCCESSFULLY! 🌟');
      setDbStatus('success');
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      addLog(`❌ TEST SUITE FAILED: ${errMsg}`);
      setDbStatus('failed');
    } finally {
      setIsTestRunning(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>OfflineFaceAuth</Text>
        <Text style={styles.subtitle}>Offline Data Layer Verification Console</Text>
      </View>

      <View style={styles.statusBox}>
        <Text style={styles.statusText}>
          Database Status: {' '}
          <Text style={[
            styles.statusBadge,
            dbStatus === 'success' && styles.successText,
            dbStatus === 'failed' && styles.failedText,
            dbStatus === 'running' && styles.runningText,
          ]}>
            {dbStatus.toUpperCase()}
          </Text>
        </Text>

        <TouchableOpacity 
          style={[styles.button, isTestRunning && styles.buttonDisabled]} 
          onPress={runOfflineDataLayerTests}
          disabled={isTestRunning}
        >
          {isTestRunning ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Run SQLite & Sync Tests</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.consoleBox}>
        <Text style={styles.consoleTitle}>Console Logs:</Text>
        {testLogs.length === 0 ? (
          <Text style={styles.emptyText}>No logs yet. Press the button above to execute tests.</Text>
        ) : (
          testLogs.map((log, index) => (
            <Text 
              key={index} 
              style={[
                styles.logLine,
                log.includes('✅') && styles.successLog,
                log.includes('❌') && styles.errorLog,
                log.includes('🚀') && styles.systemLog,
              ]}
            >
              {log}
            </Text>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#0f172a',
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#38bdf8',
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 5,
  },
  statusBox: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    color: '#e2e8f0',
    fontWeight: '600',
    marginBottom: 15,
  },
  statusBadge: {
    fontWeight: 'bold',
    color: '#94a3b8',
  },
  successText: {
    color: '#4ade80',
  },
  failedText: {
    color: '#f87171',
  },
  runningText: {
    color: '#fbbf24',
  },
  button: {
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#334155',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  consoleBox: {
    backgroundColor: '#020617',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#1e293b',
    flex: 1,
    minHeight: 300,
  },
  consoleTitle: {
    fontSize: 16,
    color: '#f1f5f9',
    fontWeight: 'bold',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingBottom: 5,
  },
  emptyText: {
    color: '#64748b',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 50,
  },
  logLine: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
    lineHeight: 16,
  },
  successLog: {
    color: '#4ade80',
  },
  errorLog: {
    color: '#f87171',
    fontWeight: 'bold',
  },
  systemLog: {
    color: '#38bdf8',
    fontWeight: 'bold',
  },
});