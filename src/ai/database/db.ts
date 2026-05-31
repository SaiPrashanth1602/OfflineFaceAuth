import SQLite, { SQLiteDatabase } from 'react-native-sqlite-storage';

// Enable Promise-based API for react-native-sqlite-storage
SQLite.enablePromise(true);

const DATABASE_NAME = 'offlineFaceAuth.db';
let dbInstance: SQLiteDatabase | null = null;
let initPromise: Promise<SQLiteDatabase> | null = null;

/**
 * Initializes the SQLite database and creates the required tables.
 * Uses a single Promise reference to prevent race conditions during multiple rapid parallel calls.
 */
export const initDatabase = async (): Promise<SQLiteDatabase> => {
  if (dbInstance) {
    return dbInstance;
  }

  if (initPromise) {
    console.log('[Database] Awaiting ongoing database initialization...');
    return initPromise;
  }

  // Create the initialization Promise once
  initPromise = (async () => {
    try {
      console.log('[Database] Opening SQLite database...');
      dbInstance = await SQLite.openDatabase({
        name: DATABASE_NAME,
        location: 'default',
      });

      console.log('[Database] Database opened successfully. Running migrations/table creation...');

      // Enable foreign keys for referential integrity
      await dbInstance.executeSql('PRAGMA foreign_keys = ON;');

      // Table: users
      await dbInstance.executeSql(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          embedding TEXT NOT NULL
        );
      `);

      // Table: auth_logs
      await dbInstance.executeSql(`
        CREATE TABLE IF NOT EXISTS auth_logs (
          id TEXT PRIMARY KEY,
          userId TEXT NOT NULL,
          confidence REAL NOT NULL,
          liveness INTEGER NOT NULL CHECK (liveness IN (0, 1)),
          status TEXT NOT NULL,
          timestamp TEXT NOT NULL,
          FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
        );
      `);

      // Table: sync_queue
      await dbInstance.executeSql(`
        CREATE TABLE IF NOT EXISTS sync_queue (
          id TEXT PRIMARY KEY,
          payload TEXT NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('pending', 'synced', 'failed')),
          createdAt TEXT NOT NULL
        );
      `);

      console.log('[Database] Database initialization completed successfully');
      return dbInstance;
    } catch (error) {
      console.error('[Database] Critical error during database initialization:', error);
      dbInstance = null;
      initPromise = null; // Clear promise reference to allow retries
      throw error;
    }
  })();

  return initPromise;
};

/**
 * Retrieves the singleton database instance.
 * Throws an error if the database has not been initialized yet.
 */
export const getDB = (): SQLiteDatabase => {
  if (!dbInstance) {
    throw new Error(
      '[Database] Database not initialized. Please call initDatabase() first during app startup.'
    );
  }
  return dbInstance;
};