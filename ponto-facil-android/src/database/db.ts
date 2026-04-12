import * as SQLite from 'expo-sqlite';
import { SQL_SCHEMA } from './schema';

const DATABASE_NAME = 'pontofacil.db';

export const getDatabase = async () => {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  return db;
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
