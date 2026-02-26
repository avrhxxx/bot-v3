// src/AllianceServices.ts
import { MongoClient, Db, Collection } from 'mongodb';
import { config } from './config';

interface Alliance {
  id: string;
  name: string;
  members: string[];
  leader?: string;
}

export class AllianceService {
  private static client: MongoClient;
  private static db: Db;
  private static alliances: Collection<Alliance>;

  // inicjalizacja po starcie aplikacji
  static async init() {
    if (!config.mongoUri) throw new Error('MONGO_URI is not defined!');
    this.client = new MongoClient(config.mongoUri);
    await this.client.connect();
    this.db = this.client.db(); // jeśli nie podałeś nazwy DB w URI, użyje domyślnej
    this.alliances = this.db.collection<Alliance>('alliances');
    console.log('[AllianceService] Connected to MongoDB');
  }

  // dodaje członka do sojuszu
  static async addMember(allianceId: string, memberId: string) {
    await this.alliances.updateOne(
      { id: allianceId },
      { $addToSet: { members: memberId } } // $addToSet dodaje tylko jeśli nie ma jeszcze
    );
    console.log(`[AllianceService] addMember: ${memberId} to ${allianceId}`);
  }

  // inne metody np. tworzenie sojuszu
  static async createAlliance(id: string, name: string) {
    await this.alliances.insertOne({ id, name, members: [] });
    console.log(`[AllianceService] createAlliance: ${id} (${name})`);
  }

  // pobranie sojuszu
  static async getAlliance(allianceId: string) {
    return this.alliances.findOne({ id: allianceId });
  }
}