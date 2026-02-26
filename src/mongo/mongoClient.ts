import { MongoClient, Db } from 'mongodb';
import { config } from '../config/config';

let client: MongoClient;
let db: Db;

export async function connectMongo() {
  if (!config.mongoUri) throw new Error('MONGO_URI is not defined!');
  client = new MongoClient(config.mongoUri);
  await client.connect();
  db = client.db(); // jeśli w URI nie ma nazwy DB, Mongo użyje domyślnej
  console.log('[Mongo] Connected to MongoDB');
  return db;
}

// pomocnicza funkcja do pobrania kolekcji
export function getCollection<T>(name: string) {
  if (!db) throw new Error('MongoDB not initialized');
  return db.collection<T>(name);
}