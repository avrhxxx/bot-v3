// src/AllianceServices.ts
import { db } from './mongo/mongoClient';

export interface Alliance {
  _id: string;
  name: string;
  members: string[];
  leader?: string;
}

const alliances = db.collection<Alliance>('alliances');

export class AllianceService {
  static async createAlliance(id: string, name: string) {
    const exists = await alliances.findOne({ _id: id });
    if (exists) return exists;

    await alliances.insertOne({ _id: id, name, members: [] });
    console.log(`[AllianceService] Created alliance: ${name} (${id})`);
    return { _id: id, name, members: [] } as Alliance;
  }

  static async addMember(allianceId: string, memberId: string) {
    await alliances.updateOne(
      { _id: allianceId },
      { $addToSet: { members: memberId } }
    );
    console.log(`[AllianceService] addMember: ${memberId} to ${allianceId}`);
  }

  static async setLeader(allianceId: string, leaderId: string) {
    await alliances.updateOne(
      { _id: allianceId },
      { $set: { leader: leaderId } }
    );
    console.log(`[AllianceService] setLeader: ${leaderId} for ${allianceId}`);
  }

  static async getAlliance(allianceId: string) {
    return alliances.findOne({ _id: allianceId });
  }

  static async getMembers(allianceId: string) {
    const alliance = await alliances.findOne({ _id: allianceId });
    return alliance?.members || [];
  }
}