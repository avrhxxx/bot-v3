import { MutationGate } from "../../engine/MutationGate";
import {
  AllianceRepo,
  PendingDeletionRepo
} from "../../data/Repositories";
import { Alliance } from "./AllianceTypes";
import { Ownership } from "../../system/Ownership";

const MAX_MEMBERS = 100;
const MAX_R4 = 10;

export class AllianceService {
  // =============================
  // CREATE
  // =============================
  static async createAlliance(
    actorId: string,
    allianceId: string,
    name: string
  ) {
    if (!Ownership.isDiscordOwner(actorId)) {
      throw new Error("Only Discord Owner can create alliance");
    }

    if (AllianceRepo.get(allianceId)) {
      throw new Error("Alliance already exists");
    }

    await MutationGate.execute(
      {
        operation: "ALLIANCE_CREATE",
        actor: actorId,
        allianceId
      },
      async () => {
        const alliance: Alliance = {
          id: allianceId,
          name,
          r5: actorId,
          r4: [],
          r3: [],
          orphaned: false,
          createdAt: Date.now()
        };

        AllianceRepo.set(allianceId, alliance);
      },
      { requireGlobalLock: true }
    );
  }

  // =============================
  // ADD MEMBER (R3)
  // =============================
  static async addMember(
    actorId: string,
    allianceId: string,
    userId: string
  ) {
    const alliance = this.getAllianceOrThrow(allianceId);

    if (alliance.orphaned) throw new Error("Alliance is orphaned");

    if (actorId !== alliance.r5 && !alliance.r4.includes(actorId)) {
      throw new Error("Insufficient permissions");
    }

    if (this.isMember(alliance, userId)) {
      throw new Error("Already member");
    }

    if (this.getTotalMembers(alliance) >= MAX_MEMBERS) {
      throw new Error("Member limit reached");
    }

    await MutationGate.execute(
      {
        operation: "ALLIANCE_ADD_MEMBER",
        actor: actorId,
        allianceId
      },
      async () => {
        alliance.r3.push(userId);
        this.checkOrphanState(alliance);
        AllianceRepo.set(allianceId, alliance);
      },
      { requireAllianceLock: true }
    );
  }

  // =============================
  // PROMOTE TO R4
  // =============================
  static async promoteToR4(
    actorId: string,
    allianceId: string,
    userId: string
  ) {
    const alliance = this.getAllianceOrThrow(allianceId);

    if (actorId !== alliance.r5) {
      throw new Error("Only R5 can promote");
    }

    if (!alliance.r3.includes(userId)) {
      throw new Error("User not in R3");
    }

    if (alliance.r4.length >= MAX_R4) {
      throw new Error("R4 limit reached");
    }

    await MutationGate.execute(
      {
        operation: "ALLIANCE_PROMOTE_R4",
        actor: actorId,
        allianceId
      },
      async () => {
        alliance.r3 = alliance.r3.filter(id => id !== userId);
        alliance.r4.push(userId);
        AllianceRepo.set(allianceId, alliance);
      },
      { requireAllianceLock: true }
    );
  }

  // =============================
  // REMOVE MEMBER
  // =============================
  static async removeMember(
    actorId: string,
    allianceId: string,
    userId: string
  ) {
    const alliance = this.getAllianceOrThrow(allianceId);

    if (!this.isMember(alliance, userId)) {
      throw new Error("User not member");
    }

    const actorIsR5 = actorId === alliance.r5;
    const actorIsR4 = alliance.r4.includes(actorId);
    const targetIsR4 = alliance.r4.includes(userId);

    if (!actorIsR5 && !actorIsR4) {
      throw new Error("Insufficient permissions");
    }

    if (actorIsR4 && targetIsR4) {
      throw new Error("R4 cannot remove another R4");
    }

    if (targetIsR4 && !actorIsR5) {
      throw new Error("Only R5 can remove R4");
    }

    await MutationGate.execute(
      {
        operation: "ALLIANCE_REMOVE_MEMBER",
        actor: actorId,
        allianceId
      },
      async () => {
        alliance.r3 = alliance.r3.filter(id => id !== userId);
        alliance.r4 = alliance.r4.filter(id => id !== userId);

        if (alliance.r5 === userId) {
          alliance.r5 = "";
        }

        this.checkOrphanState(alliance);
        AllianceRepo.set(allianceId, alliance);
      },
      { requireAllianceLock: true }
    );
  }

  // =============================
  // TRANSFER LEADERSHIP
  // =============================
  static async transferLeadership(
    actorId: string,
    allianceId: string,
    newLeaderId: string
  ) {
    const alliance = this.getAllianceOrThrow(allianceId);

    if (actorId !== alliance.r5) {
      throw new Error("Only R5 can transfer leadership");
    }

    if (!this.isMember(alliance, newLeaderId)) {
      throw new Error("New leader must be member");
    }

    await MutationGate.execute(
      {
        operation: "ALLIANCE_TRANSFER_LEADERSHIP",
        actor: actorId,
        allianceId
      },
      async () => {
        alliance.r4 = alliance.r4.filter(id => id !== newLeaderId);
        alliance.r3 = alliance.r3.filter(id => id !== newLeaderId);

        alliance.r3.push(alliance.r5);
        alliance.r5 = newLeaderId;

        AllianceRepo.set(allianceId, alliance);
      },
      { requireAllianceLock: true }
    );
  }

  // =============================
  // DELETE (2-step)
  // =============================
  static requestDelete(actorId: string, allianceId: string) {
    if (!Ownership.isDiscordOwner(actorId)) {
      throw new Error("Only Discord Owner can delete alliance");
    }

    if (PendingDeletionRepo.get(allianceId)) {
      throw new Error("Deletion already pending");
    }

    PendingDeletionRepo.set(allianceId, {
      requestedBy: actorId,
      requestedAt: Date.now()
    });
  }

  static async confirmDelete(actorId: string, allianceId: string) {
    const pending = PendingDeletionRepo.get(allianceId);
    if (!pending) throw new Error("No deletion request found");

    if (pending.requestedBy !== actorId) {
      throw new Error("Only original requester can confirm");
    }

    await MutationGate.execute(
      {
        operation: "ALLIANCE_DELETE",
        actor: actorId,
        allianceId
      },
      async () => {
        AllianceRepo.delete(allianceId);
        PendingDeletionRepo.delete(allianceId);
      },
      { requireGlobalLock: true }
    );
  }

  // =============================
  // HELPERS
  // =============================
  private static getAllianceOrThrow(id: string): Alliance {
    const alliance = AllianceRepo.get(id);
    if (!alliance) throw new Error("Alliance not found");
    return alliance;
  }

  private static isMember(alliance: Alliance, userId: string): boolean {
    return (
      alliance.r5 === userId ||
      alliance.r4.includes(userId) ||
      alliance.r3.includes(userId)
    );
  }

  private static getTotalMembers(alliance: Alliance): number {
    return (
      1 + alliance.r4.length + alliance.r3.length
    );
  }

  private static checkOrphanState(alliance: Alliance) {
    if (!alliance.r5 && alliance.r4.length === 0 && alliance.r3.length === 0) {
      alliance.orphaned = true;
    } else {
      alliance.orphaned = false;
    }
  }
}