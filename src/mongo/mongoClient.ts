// src/mongo/mongoClient.ts
import { MongoClient, Db, Collection } from 'mongodb';
import { config } from '../config/config';

let client: MongoClient;
let db: Db;

/**
 * Łączy się z MongoDB i zwraca obiekt Db
 */
export async function connectMongo(): Promise<Db> {
  if (!config.mongoUri) throw new Error('MONGO_URI is not defined!');
  
  // MongoClient 6.x używa wbudowanych typów
  client = new MongoClient(config.mongoUri);
  await client.connect();

  // Jeśli URI zawiera nazwę bazy, Mongo użyje jej; jeśli nie, możesz podać ręcznie
  db = client.db();
  console.log('[Mongo] Connected to MongoDB');
  return db;
}

/**
 * Pobiera kolekcję o typie T
 * @param name nazwa kolekcji
 */
export function getCollection<T>(name: string): Collection<T> {
  if (!db) throw new Error('MongoDB not initialized. Call connectMongo() first.');
  return db.collection<T>(name);
}

/**
 * Opcjonalnie: zamyka połączenie
 */
export async function closeMongo(): Promise<void> {
  if (client) {
    await client.close();
    console.log('[Mongo] Connection closed');
  }
}