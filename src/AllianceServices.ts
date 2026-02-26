import { getCollection } from './mongo/mongoClient';
import { Document } from 'mongodb';

export interface Alliance {
  id: string;
  name: string;
  tag?: string;
  members: string[];
  leader?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AllianceAudit {
  allianceId: string;
  action: string;
  actor: string;
  timestamp: Date;
  details?: Record<string, any>;
}

export class AllianceService {
  private static get alliances() {
    return getCollection<Alliance & Document>('alliances');
  }

  private static get auditLogs() {
    return getCollection<AllianceAudit & Document>('alliance_audit');
  }

  static async createAlliance(id: string, name: string) {
    const now = new Date();
    await this.alliances.insertOne({
      id,
      name,
      members: [],
      leader: undefined,
      createdAt: now,
      updatedAt: now,
    });
    console.log(`[AllianceService] createAlliance: ${id} (${name})`);
    await this.logAction(id, 'CREATE_ALLIANCE', 'SYSTEM', { name });
  }

  static async addMember(allianceId: string, memberId: string) {
    const result = await this.alliances.updateOne(
      { id: allianceId },
      { $addToSet: { members: memberId }, $set: { updatedAt: new Date() } }
    );
    if (result.matchedCount === 0) throw new Error(`Alliance ${allianceId} not found`);
    console.log(`[AllianceService] addMember: ${memberId} to ${allianceId}`);
    await this.logAction(allianceId, 'ADD_MEMBER', memberId);
  }

  static async removeMember(allianceId: string, memberId: string) {
    await this.alliances.updateOne(
      { id: allianceId },
      { $pull: { members: memberId }, $set: { updatedAt: new Date() } }
    );
    console.log(`[AllianceService] removeMember: ${memberId} from ${allianceId}`);
    await this.logAction(allianceId, 'REMOVE_MEMBER', memberId);
  }

  static async transferLeader(allianceId: string, newLeaderId: string) {
    await this.alliances.updateOne(
      { id: allianceId },
      { $set: { leader: newLeaderId, updatedAt: new Date() } }
    );
    console.log(`[AllianceService] transferLeader: ${newLeaderId} in ${allianceId}`);
    await this.logAction(allianceId, 'TRANSFER_LEADER', newLeaderId);
  }

  static async getAlliance(allianceId: string): Promise<Alliance | null> {
    return this.alliances.findOne({ id: allianceId });
  }

  private static async logAction(
    allianceId: string,
    action: string,
    actor: string,
    details?: Record<string, any>
  ) {
    await this.auditLogs.insertOne({
      allianceId,
      action,
      actor,
      timestamp: new Date(),
      details,
    });
  }
}