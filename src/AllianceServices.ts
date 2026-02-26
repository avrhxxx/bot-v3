// src/AllianceService.ts
import { db } from './mongo/mongoClient';

export interface Alliance {
  _id: string;          // ID sojuszu
  name: string;
  members: string[];    // ID członków
  leader?: string;      // ID lidera
}

const alliances = db.collection<Alliance>('alliances');

export class AllianceService {
  /** Tworzy nowy sojusz */
  static async createAlliance(id: string, name: string) {
    const exists = await alliances.findOne({ _id: id });
    if (exists) return exists;

    await alliances.insertOne({ _id: id, name, members: [] });
    console.log(`[AllianceService] Created alliance: ${name} (${id})`);
    return { _id: id, name, members: [] } as Alliance;
  }

  /** Dodaje członka do sojuszu */
  static async addMember(allianceId: string, memberId: string) {
    await alliances.updateOne(
      { _id: allianceId },
      { $addToSet: { members: memberId } } // dodaje tylko jeśli nie ma
    );
    console.log(`[AllianceService] addMember: ${memberId} to ${allianceId}`);
  }

  /** Ustawia lidera sojuszu */
  static async setLeader(allianceId: string, leaderId: string) {
    await alliances.updateOne(
      { _id: allianceId },
      { $set: { leader: leaderId } }
    );
    console.log(`[AllianceService] setLeader: ${leaderId} for ${allianceId}`);
  }

  /** Pobiera sojusz */
  static async getAlliance(allianceId: string) {
    return alliances.findOne({ _id: allianceId });
  }

  /** Pobiera wszystkich członków */
  static async getMembers(allianceId: string) {
    const alliance = await alliances.findOne({ _id: allianceId });
    return alliance?.members || [];
  }
}