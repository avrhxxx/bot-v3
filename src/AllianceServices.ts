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
    let alliance = db.alliances.get(allianceId);

    // 🔥 AUTO-CREATE w memory mode
    if (!alliance) {
      console.log(`[AllianceService] Auto-creating alliance ${allianceId}`);
      await this.createAlliance(allianceId, "AutoCreated Alliance");
      alliance = db.alliances.get(allianceId)!;
    }

    if (!alliance.members.includes(memberId)) {
      alliance.members.push(memberId);
    }

    alliance.updatedAt = new Date();

    console.log(`[AllianceService] (Memory) addMember: ${memberId} to ${allianceId}`);
  }

  static async transferLeader(allianceId: string, newLeaderId: string) {
    let alliance = db.alliances.get(allianceId);

    // 🔥 AUTO-CREATE w memory mode
    if (!alliance) {
      console.log(`[AllianceService] Auto-creating alliance ${allianceId}`);
      await this.createAlliance(allianceId, "AutoCreated Alliance");
      alliance = db.alliances.get(allianceId)!;
    }

    alliance.leader = newLeaderId;
    alliance.updatedAt = new Date();

    console.log(`[AllianceService] (Memory) transferLeader: ${newLeaderId} in ${allianceId}`);
  }

  static async getAlliance(allianceId: string): Promise<Alliance | null> {
    return db.alliances.get(allianceId) ?? null;
  }
}