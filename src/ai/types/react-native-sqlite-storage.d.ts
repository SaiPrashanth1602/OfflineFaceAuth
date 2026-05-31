declare module 'react-native-sqlite-storage' {
  export interface ResultSet {
    insertId: number;
    rowsAffected: number;
    rows: {
      length: number;
      item(index: number): any;
      raw(): any[];
    };
  }

  export interface Transaction {
    executeSql(
      sqlStatement: string,
      arguments?: any[]
    ): Promise<[ResultSet]>;
  }

  export interface SQLiteDatabase {
    transaction(scope: (tx: Transaction) => void): Promise<void>;
    readTransaction(scope: (tx: Transaction) => void): Promise<void>;
    close(): Promise<void>;
    executeSql(
      statement: string,
      params?: any[]
    ): Promise<[ResultSet]>;
    sqlBatch(statements: (string | [string, any[]])[]): Promise<void>;
  }

  export interface DatabaseOptionalParams {
    name: string;
    location?: string;
    createFromLocation?: any;
    readOnly?: boolean;
    key?: string;
    [key: string]: any;
  }

  export function openDatabase(
    params: DatabaseOptionalParams,
    success?: () => void,
    error?: (err: any) => void
  ): Promise<SQLiteDatabase>;

  export function deleteDatabase(
    params: DatabaseOptionalParams,
    success?: () => void,
    error?: (err: any) => void
  ): Promise<void>;

  export function enablePromise(enable: boolean): void;

  const SQLite: {
    openDatabase: typeof openDatabase;
    deleteDatabase: typeof deleteDatabase;
    enablePromise: typeof enablePromise;
  };

  export default SQLite;
}
