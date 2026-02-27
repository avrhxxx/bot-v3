// src/AllianceServices.ts
import { db, Alliance, AllianceAudit } from './data/Database';

export class AllianceService {
  static async createAlliance(id: string, name: string) {
    const now = new Date();
    db.alliances.set(id, { id, name, members: [], createdAt: now, updatedAt: now });
    db.audits.push({ allianceId: id, action: 'CREATE_ALLIANCE', actor: 'SYSTEM', timestamp: now, details: { name } });
    console.log(`[AllianceService] (Memory) createAlliance: ${id} (${name})`);
  }

  static async addMember(allianceId: string, memberId: string) {
    const alliance = db.alliances.get(allianceId);
    if (!alliance) throw new Error(`Alliance ${allianceId} not found`);
    if (!alliance.members.includes(memberId)) alliance.members.push(memberId);
    alliance.updatedAt = new Date();
    db.audits.push({ allianceId, action: 'ADD_MEMBER', actor: memberId, timestamp: new Date() });
    console.log(`[AllianceService] (Memory) addMember: ${memberId} to ${allianceId}`);
  }

  static async transferLeader(allianceId: string, newLeaderId: string) {
    const alliance = db.alliances.get(allianceId);
    if (!alliance) throw new Error(`Alliance ${allianceId} not found`);
    alliance.leader = newLeaderId;
    alliance.updatedAt = new Date();
    db.audits.push({ allianceId, action: 'TRANSFER_LEADER', actor: newLeaderId, timestamp: new Date() });
    console.log(`[AllianceService] (Memory) transferLeader: ${newLeaderId} in ${allianceId}`);
  }

  static async getAlliance(allianceId: string) {
    return db.alliances.get(allianceId) ?? null;
  }
}