// src/AllianceServices.ts
import { db } from './data/Database';

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
  static async createAlliance(id: string, name: string) {
    const now = new Date();
    db.alliances.set(id, {
      id,
      name,
      members: [],
      createdAt: now,
      updatedAt: now
    });

    db.journal.set(`${id}-${now.getTime()}`, {
      id: `${id}-${now.getTime()}`,
      timestamp: now.getTime()
    });

    console.log(`[AllianceService] (Memory) createAlliance: ${id} (${name})`);
  }

  static async addMember(allianceId: string, memberId: string) {
    const alliance = db.alliances.get(allianceId);
    if (!alliance) throw new Error(`Alliance ${allianceId} not found`);

    if (!alliance.members.includes(memberId)) {
      alliance.members.push(memberId);
    }

    alliance.updatedAt = new Date();
    console.log(`[AllianceService] (Memory) addMember: ${memberId} to ${allianceId}`);
  }

  static async transferLeader(allianceId: string, newLeaderId: string) {
    const alliance = db.alliances.get(allianceId);
    if (!alliance) throw new Error(`Alliance ${allianceId} not found`);

    alliance.leader = newLeaderId;
    alliance.updatedAt = new Date();

    console.log(`[AllianceService] (Memory) transferLeader: ${newLeaderId} in ${allianceId}`);
  }

  static async getAlliance(allianceId: string): Promise<Alliance | null> {
    return db.alliances.get(allianceId) ?? null;
  }
}