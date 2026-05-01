import * as SQLite from 'expo-sqlite';
import { SQL_SCHEMA } from './schema';

const DATABASE_NAME = 'pontofacil.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export const getDatabase = async () => {
  if (dbInstance) return dbInstance;
  if (dbPromise) return dbPromise;
  
  dbPromise = SQLite.openDatabaseAsync(DATABASE_NAME).then(db => {
    dbInstance = db;
    return db;
  });
  
  return dbPromise;
};

export const initializeDatabase = async () => {
  const db = await getDatabase();
  try {
    await db.execAsync(SQL_SCHEMA);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};
