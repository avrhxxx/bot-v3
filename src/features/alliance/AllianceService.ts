// src/features/alliance/AllianceService.ts

import { MutationGate } from "../../engine/MutationGate";
import { AllianceRepo, PendingDeletionRepo, db } from "../../data/Repositories";
import { Alliance, AllianceRoles, AllianceChannels } from "./AllianceTypes";
import { Ownership } from "../../system/Ownership";
import { AllianceIntegrity } from "./integrity/AllianceIntegrity";

export interface PendingDeletionRecord {
  requestedBy: string;
  requestedAt: number;
}

const MAX_MEMBERS = 100;
const MAX_R4 = 10;

export class AllianceService {
  static async createAlliance(params: {
    actorId: string;
    guildId: string;
    allianceId: string;
    tag: string;
    name: string;
    leaderId: string;
    roles: AllianceRoles;
    channels: AllianceChannels;
  }) {
    const { actorId, guildId, allianceId, tag, name, leaderId, roles, channels } = params;

    if (!Ownership.isDiscordOwner(actorId)) throw new Error("Only Discord Owner can create alliance");
    if (AllianceRepo.get(allianceId)) throw new Error("Alliance already exists");

    AllianceIntegrity.validateTag(tag);
    AllianceIntegrity.ensureTagUnique(guildId, tag);
    AllianceIntegrity.ensureUserNotInAlliance(leaderId);

    await MutationGate.execute(
      { operation: "ALLIANCE_CREATE", actor: actorId, allianceId, requireGlobalLock: true },
      async () => {
        const alliance: Alliance = {
          id: allianceId,
          guildId,
          tag: tag.toUpperCase(),
          name,
          members: { r5: leaderId, r4: [], r3: [] },
          roles,
          channels,
          orphaned: false,
          createdAt: Date.now()
        };

        AllianceIntegrity.ensureSingleR5(alliance);
        AllianceIntegrity.ensureRoleExclusivity(alliance, leaderId);

        AllianceRepo.set(allianceId, alliance);

        // Audit
        db.journal.set(`${Date.now()}-${allianceId}`, {
          operation: "CREATE_ALLIANCE",
          actor: actorId,
          allianceId,
          timestamp: Date.now(),
          snapshot: { ...alliance }
        });
      }
    );
  }

  static async addMember(actorId: string, allianceId: string, userId: string) {
    const alliance = this.getAllianceOrThrow(allianceId);

    if (alliance.orphaned) throw new Error("Alliance is orphaned");

    const { r5, r4 } = alliance.members;

    if (actorId !== r5 && !r4.includes(actorId)) throw new Error("Insufficient permissions");
    if (this.isMember(alliance, userId)) throw new Error("Already member");
    if (this.getTotalMembers(alliance) >= MAX_MEMBERS) throw new Error("Member limit reached");

    AllianceIntegrity.ensureUserNotInAlliance(userId);

    await MutationGate.execute(
      { operation: "ALLIANCE_ADD_MEMBER", actor: actorId, allianceId, requireAllianceLock: true },
      async () => {
        alliance.members.r3.push(userId);
        AllianceIntegrity.ensureRoleExclusivity(alliance, userId);
        this.checkOrphanState(alliance);
        AllianceRepo.set(allianceId, alliance);

        db.journal.set(`${Date.now()}-${allianceId}`, {
          operation: "ADD_MEMBER",
          actor: actorId,
          allianceId,
          userId,
          timestamp: Date.now(),
          snapshot: { ...alliance }
        });
      }
    );
  }

  static async promoteToR4(actorId: string, allianceId: string, userId: string) {
    const alliance = this.getAllianceOrThrow(allianceId);

    if (actorId !== alliance.members.r5) throw new Error("Only R5 can promote");
    if (!alliance.members.r3.includes(userId)) throw new Error("User not in R3");
    if (alliance.members.r4.length >= MAX_R4) throw new Error("R4 limit reached");

    await MutationGate.execute(
      { operation: "ALLIANCE_PROMOTE_R4", actor: actorId, allianceId, requireAllianceLock: true },
      async () => {
        alliance.members.r3 = alliance.members.r3.filter(id => id !== userId);
        alliance.members.r4.push(userId);
        AllianceIntegrity.ensureRoleExclusivity(alliance, userId);
        AllianceRepo.set(allianceId, alliance);

        db.journal.set(`${Date.now()}-${allianceId}`, {
          operation: "PROMOTE_TO_R4",
          actor: actorId,
          allianceId,
          userId,
          timestamp: Date.now(),
          snapshot: { ...alliance }
        });
      }
    );
  }

  static async removeMember(actorId: string, allianceId: string, userId: string) {
    const alliance = this.getAllianceOrThrow(allianceId);

    if (!this.isMember(alliance, userId)) throw new Error("User not member");

    const { r5, r4 } = alliance.members;
    const actorIsR5 = actorId === r5;
    const actorIsR4 = r4.includes(actorId);
    const targetIsR4 = r4.includes(userId);

    if (!actorIsR5 && !actorIsR4) throw new Error("Insufficient permissions");
    if (actorIsR4 && targetIsR4) throw new Error("R4 cannot remove another R4");
    if (targetIsR4 && !actorIsR5) throw new Error("Only R5 can remove R4");

    await MutationGate.execute(
      { operation: "ALLIANCE_REMOVE_MEMBER", actor: actorId, allianceId, requireAllianceLock: true },
      async () => {
        alliance.members.r3 = alliance.members.r3.filter(id => id !== userId);
        alliance.members.r4 = alliance.members.r4.filter(id => id !== userId);
        if (alliance.members.r5 === userId) alliance.members.r5 = "";

        this.checkOrphanState(alliance);
        AllianceRepo.set(allianceId, alliance);

        db.journal.set(`${Date.now()}-${allianceId}`, {
          operation: "REMOVE_MEMBER",
          actor: actorId,
          allianceId,
          userId,
          timestamp: Date.now(),
          snapshot: { ...alliance }
        });
      }
    );
  }

  static async transferLeadership(actorId: string, allianceId: string, newLeaderId: string) {
    const alliance = this.getAllianceOrThrow(allianceId);

    if (actorId !== alliance.members.r5) throw new Error("Only R5 can transfer leadership");
    if (!this.isMember(alliance, newLeaderId)) throw new Error("New leader must be member");

    await MutationGate.execute(
      { operation: "ALLIANCE_TRANSFER_LEADERSHIP", actor: actorId, allianceId, requireAllianceLock: true },
      async () => {
        alliance.members.r4 = alliance.members.r4.filter(id => id !== newLeaderId);
        alliance.members.r3 = alliance.members.r3.filter(id => id !== newLeaderId);
        alliance.members.r3.push(alliance.members.r5);
        alliance.members.r5 = newLeaderId;

        AllianceIntegrity.ensureSingleR5(alliance);
        AllianceRepo.set(allianceId, alliance);

        db.journal.set(`${Date.now()}-${allianceId}`, {
          operation: "TRANSFER_LEADERSHIP",
          actor: actorId,
          allianceId,
          newLeaderId,
          timestamp: Date.now(),
          snapshot: { ...alliance }
        });
      }
    );
  }

  static requestDelete(actorId: string, allianceId: string) {
    if (!Ownership.isDiscordOwner(actorId)) throw new Error("Only Discord Owner can delete alliance");
    if (PendingDeletionRepo.get(allianceId)) throw new Error("Deletion already pending");

    const pending: PendingDeletionRecord = { requestedBy: actorId, requestedAt: Date.now() };
    PendingDeletionRepo.set(allianceId, pending);

    db.journal.set(`${Date.now()}-${allianceId}`, {
      operation: "REQUEST_DELETE",
      actor: actorId,
      allianceId,
      timestamp: Date.now()
    });
  }

  static async confirmDelete(actorId: string, allianceId: string) {
    const pending = PendingDeletionRepo.get(allianceId) as PendingDeletionRecord;
    if (!pending) throw new Error("No deletion request found");
    if (pending.requestedBy !== actorId) throw new Error("Only original requester can confirm");

    await MutationGate.execute(
      { operation: "ALLIANCE_DELETE", actor: actorId, allianceId, requireGlobalLock: true },
      async () => {
        AllianceRepo.delete(allianceId);
        PendingDeletionRepo.delete(allianceId);

        db.journal.set(`${Date.now()}-${allianceId}`, {
          operation: "DELETE_ALLIANCE",
          actor: actorId,
          allianceId,
          timestamp: Date.now()
        });
      }
    );
  }

  // ----------------- HELPERS -----------------
  private static getAllianceOrThrow(id: string): Alliance {
    const alliance = AllianceRepo.get(id);
    if (!alliance) throw new Error("Alliance not found");
    return alliance;
  }

  private static isMember(alliance: Alliance, userId: string): boolean {
    return alliance.members.r5 === userId || alliance.members.r4.includes(userId) || alliance.members.r3.includes(userId);
  }

  private static getTotalMembers(alliance: Alliance): number {
    return (alliance.members.r5 ? 1 : 0) + alliance.members.r4.length + alliance.members.r3.length;
  }

  private static checkOrphanState(alliance: Alliance) {
    alliance.orphaned = !alliance.members.r5 && alliance.members.r4.length === 0 && alliance.members.r3.length === 0;
  }
}