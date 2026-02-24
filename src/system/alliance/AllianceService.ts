// File path: src/system/alliance/AllianceService.ts

import { MutationGate } from "../../engine/MutationGate";
import { AllianceRepo, PendingDeletionRepo } from "../../data/Repositories";
import { Alliance, AllianceRoles, AllianceChannels } from "./AllianceTypes";
import { Ownership } from "../Ownership";
import { AllianceIntegrity } from "./integrity/AllianceIntegrity";
import { BroadcastModule } from "./modules/broadcast/BroadcastModule";
import { RoleModule } from "./modules/role/RoleModule";
import { TransferLeaderSystem } from "./TransferLeaderSystem";

export interface PendingDeletionRecord {
  requestedBy: string;
  requestedAt: number;
}

const MAX_MEMBERS = 100;
const MAX_R4 = 10;

export class AllianceService {

  // ----------------- CREATE -----------------
  static async createAlliance(params: {
    actorId: string;
    guildId: string;
    allianceId: string;
    tag: string;
    name: string;
    leaderId: string;
    roles: AllianceRoles;
    channels: AllianceChannels;
  }): Promise<Alliance> {
    return {} as Alliance;
  }

  // ----------------- MEMBERS -----------------
  static async addMember(actorId: string, allianceId: string, userId: string): Promise<void> {}
  static async promoteToR4(actorId: string, allianceId: string, userId: string): Promise<void> {}
  static async removeMember(actorId: string, allianceId: string, userId: string): Promise<void> {}

  // ----------------- LEADERSHIP -----------------
  static async transferLeadership(actorId: string, allianceId: string, newLeaderId: string): Promise<void> {
    await TransferLeaderSystem.transferLeadership(actorId, allianceId, newLeaderId);
  }

  // ----------------- UPDATE -----------------
  static async updateTag(actorId: string, allianceId: string, newTag: string): Promise<void> {
    // stub do buildu
  }

  static async updateName(actorId: string, allianceId: string, newName: string): Promise<void> {
    // stub do buildu
  }

  // ----------------- DELETION -----------------
  static requestDelete(actorId: string, allianceId: string): void {}
  static async confirmDelete(actorId: string, allianceId: string): Promise<void> {}

  // ----------------- HELPERS -----------------
  public static getAllianceOrThrow(id: string): Alliance {
    return {} as Alliance;
  }

  private static isMember(alliance: Alliance, userId: string): boolean {
    return false;
  }

  private static getTotalMembers(alliance: Alliance): number {
    return 0;
  }

  private static checkOrphanState(alliance: Alliance): void {}

  public static logAudit(
    allianceId: string,
    entry: Omit<{ id: string } & Record<string, any>, "id">
  ): void {}
}