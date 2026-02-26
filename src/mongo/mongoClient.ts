import { MongoClient, Db, Collection, Document } from 'mongodb';
import { config } from '../config/config';

let client: MongoClient;
let db: Db;

/**
 * Łączy się z MongoDB i zwraca obiekt Db
 */
export async function connectMongo(): Promise<Db> {
  if (!config.mongoUri) throw new Error('MONGO_URI is not defined!');
  
  client = new MongoClient(config.mongoUri);
  await client.connect();

  db = client.db(); // jeśli URI nie zawiera nazwy DB, Mongo użyje domyślnej
  console.log('[Mongo] Connected to MongoDB');
  return db;
}

/**
 * Pobiera kolekcję o typie T
 */
export function getCollection<T extends Document>(name: string): Collection<T> {
  if (!db) throw new Error('MongoDB not initialized. Call connectMongo() first.');
  return db.collection<T>(name);
}

/**
 * Zamyka połączenie
 */
export async function closeMongo(): Promise<void> {
  if (client) {
    await client.close();
    console.log('[Mongo] Connection closed');
  }
}