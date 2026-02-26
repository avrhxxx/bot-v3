// src/mongo/mongoClient.ts
import { MongoClient } from 'mongodb';
import { config } from '../config/config';

export const client = new MongoClient(config.mongoUri);

export async function connectMongo() {
  await client.connect();
  console.log('✅ Connected to MongoDB Atlas!');
}

export const db = client.db(); // domyślna baza z connection string