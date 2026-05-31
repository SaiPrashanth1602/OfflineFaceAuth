import { getDB } from '../database/db';
import { User } from '../types/User';

/**
 * UserRepository provides an abstraction layer for performing CRUD operations
 * on the 'users' table in the local SQLite database.
 * 
 * Embeddings are stored as serialized strings (JSON representations of float arrays)
 * to be compatible with MobileFaceNet model outputs.
 */
export class UserRepository {
  /**
   * Registers a new user with their face embedding vector.
   * 
   * @param user The User object containing id, name, and serialized embedding.
   */
  static async createUser(user: User): Promise<void> {
    try {
      const db = getDB();
      console.log(`[UserRepository] Creating user: ${user.name} (ID: ${user.id})`);

      await db.executeSql(
        'INSERT INTO users (id, name, embedding) VALUES (?, ?, ?)',
        [user.id, user.name, user.embedding]
      );
    } catch (error) {
      console.error('[UserRepository] Error creating user:', error);
      throw error;
    }
  }

  /**
   * Retrieves a single user by their unique identifier.
   * 
   * @param id The unique string ID of the user.
   * @returns The User object if found, or null if no match exists.
   */
  static async getUser(id: string): Promise<User | null> {
    try {
      const db = getDB();
      console.log(`[UserRepository] Fetching user with ID: ${id}`);

      const [result] = await db.executeSql(
        'SELECT id, name, embedding FROM users WHERE id = ?',
        [id]
      );

      if (result.rows.length === 0) {
        console.log(`[UserRepository] User with ID: ${id} not found`);
        return null;
      }

      const item = result.rows.item(0);
      return {
        id: item.id,
        name: item.name,
        embedding: item.embedding,
      };
    } catch (error) {
      console.error(`[UserRepository] Error fetching user ${id}:`, error);
      throw error;
    }
  }

  /**
   * Retrieves all registered users from the local database.
   * Useful for matching incoming face embeddings against all registered templates.
   * 
   * @returns An array of User objects.
   */
  static async getAllUsers(): Promise<User[]> {
    try {
      const db = getDB();
      console.log('[UserRepository] Fetching all users...');

      const [result] = await db.executeSql('SELECT id, name, embedding FROM users');
      const users: User[] = [];

      for (let i = 0; i < result.rows.length; i++) {
        const item = result.rows.item(i);
        users.push({
          id: item.id,
          name: item.name,
          embedding: item.embedding,
        });
      }

      console.log(`[UserRepository] Successfully fetched ${users.length} users`);
      return users;
    } catch (error) {
      console.error('[UserRepository] Error fetching all users:', error);
      throw error;
    }
  }

  /**
   * Deletes a user by their unique identifier.
   * Note: Foreign keys are configured to ON, so deleting a user will
   * cascade delete their local authentication logs automatically.
   * 
   * @param id The unique string ID of the user to delete.
   */
  static async deleteUser(id: string): Promise<void> {
    try {
      const db = getDB();
      console.log(`[UserRepository] Deleting user with ID: ${id}`);

      await db.executeSql('DELETE FROM users WHERE id = ?', [id]);
      console.log(`[UserRepository] Successfully deleted user with ID: ${id}`);
    } catch (error) {
      console.error(`[UserRepository] Error deleting user ${id}:`, error);
      throw error;
    }
  }

  /**
   * Helper utility for Member 2 (Face Recognition) to serialize a raw embedding array
   * of floating point numbers into a string before saving it.
   */
  static serializeEmbedding(embeddingArray: number[]): string {
    return JSON.stringify(embeddingArray);
  }

  /**
   * Helper utility for Member 2 (Face Recognition) to deserialize the stored
   * embedding string back into a numeric array.
   */
  static deserializeEmbedding(embeddingStr: string): number[] {
    try {
      return JSON.parse(embeddingStr);
    } catch (e) {
      console.error('[UserRepository] Failed to deserialize embedding:', e);
      return [];
    }
  }
}