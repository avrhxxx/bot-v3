import { MongoClient, Db, Collection, Document, ServerApiVersion } from 'mongodb';
import { config } from '../config/config';

let client: MongoClient;
let db: Db;

export async function connectMongo(): Promise<Db> {
  if (!config.mongoUri) throw new Error('MONGO_URI is not defined!');

  client = new MongoClient(config.mongoUri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

  await client.connect();
  db = client.db(); // baza z URI lub domyślna
  console.log('[Mongo] Connected to MongoDB');
  return db;
}

export function getCollection<T extends Document>(name: string): Collection<T> {
  if (!db) throw new Error('MongoDB not initialized');
  return db.collection<T>(name);
}

export async function closeMongo(): Promise<void> {
  if (client) await client.close();
  console.log('[Mongo] Connection closed');
}