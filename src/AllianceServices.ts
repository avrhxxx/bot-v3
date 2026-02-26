import { getCollection } from './mongo/mongoClient';

export interface Alliance {
  id: string;
  name: string;
  members: string[];
  leader?: string;
}

export class AllianceService {
  private static get alliances() {
    return getCollection<Alliance>('alliances');
  }

  static async createAlliance(id: string, name: string) {
    await this.alliances.insertOne({ id, name, members: [] });
    console.log(`[AllianceService] createAlliance: ${id} (${name})`);
  }

  static async addMember(allianceId: string, memberId: string) {
    await this.alliances.updateOne(
      { id: allianceId },
      { $addToSet: { members: memberId } } // dodaje tylko jeśli brak
    );
    console.log(`[AllianceService] addMember: ${memberId} to ${allianceId}`);
  }

  static async transferLeader(allianceId: string, newLeaderId: string) {
    await this.alliances.updateOne(
      { id: allianceId },
      { $set: { leader: newLeaderId } }
    );
    console.log(`[AllianceService] transferLeader: ${newLeaderId} in ${allianceId}`);
  }

  static async getAlliance(allianceId: string) {
    return this.alliances.findOne({ id: allianceId });
  }
}