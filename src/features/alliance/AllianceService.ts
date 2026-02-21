import { MutationGate } from "../../engine/MutationGate";
import {
  AllianceRepo,
  PendingDeletionRepo
} from "../../data/Repositories";
import { Alliance } from "./AllianceTypes";
import { Ownership } from "../../system/Ownership";

export class AllianceService {
  // -----------------------------
  // CREATE
  // -----------------------------
  static async createAlliance(
    actorId: string,
    allianceId: string,
    name: string
  ) {
    if (!Ownership.isDiscordOwner(actorId)) {
      throw new Error("Only Discord Owner can create alliance");
    }

    const existing = AllianceRepo.get(allianceId);
    if (existing) throw new Error("Alliance already exists");

    await MutationGate.execute(
      {
        operation: "ALLIANCE_CREATE",
        actor: actorId,
        allianceId,
        preState: null
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

  // -----------------------------
  // ADD MEMBER (R3)
  // -----------------------------
  static async addMember(
    actorId: string,
    allianceId: string,
    userId: string
  ) {
    const alliance = AllianceRepo.get(allianceId);
    if (!alliance) throw new Error("Alliance not found");

    if (alliance.orphaned) throw new Error("Alliance is orphaned");

    if (actorId !== alliance.r5 && !alliance.r4.includes(actorId)) {
      throw new Error("Insufficient permissions");
    }

    if (alliance.r3.includes(userId)) {
      throw new Error("Already member");
    }

    await MutationGate.execute(
      {
        operation: "ALLIANCE_ADD_MEMBER",
        actor: actorId,
        allianceId,
        preState: alliance
      },
      async () => {
        alliance.r3.push(userId);
        this.checkOrphanState(alliance);
        AllianceRepo.set(allianceId, alliance);
      },
      { requireAllianceLock: true }
    );
  }

  // -----------------------------
  // PROMOTE TO R4
  // -----------------------------
  static async promoteToR4(
    actorId: string,
    allianceId: string,
    userId: string
  ) {
    const alliance = AllianceRepo.get(allianceId);
    if (!alliance) throw new Error("Alliance not found");

    if (actorId !== alliance.r5)
      throw new Error("Only R5 can promote to R4");

    if (!alliance.r3.includes(userId))
      throw new Error("User not in R3");

    await MutationGate.execute(
      {
        operation: "ALLIANCE_PROMOTE_R4",
        actor: actorId,
        allianceId,
        preState: alliance
      },
      async () => {
        alliance.r3 = alliance.r3.filter(id => id !== userId);
        alliance.r4.push(userId);
        this.checkOrphanState(alliance);
        AllianceRepo.set(allianceId, alliance);
      },
      { requireAllianceLock: true }
    );
  }

  // -----------------------------
  // DEMOTE R4
  // -----------------------------
  static async demoteR4(
    actorId: string,
    allianceId: string,
    userId: string
  ) {
    const alliance = AllianceRepo.get(allianceId);
    if (!alliance) throw new Error("Alliance not found");

    if (actorId !== alliance.r5)
      throw new Error("Only R5 can demote R4");

    if (!alliance.r4.includes(userId))
      throw new Error("User not R4");

    await MutationGate.execute(
      {
        operation: "ALLIANCE_DEMOTE_R4",
        actor: actorId,
        allianceId,
        preState: alliance
      },
      async () => {
        alliance.r4 = alliance.r4.filter(id => id !== userId);
        alliance.r3.push(userId);
        this.checkOrphanState(alliance);
        AllianceRepo.set(allianceId, alliance);
      },
      { requireAllianceLock: true }
    );
  }

  // -----------------------------
  // TRANSFER LEADERSHIP
  // -----------------------------
  static async transferLeadership(
    actorId: string,
    allianceId: string,
    newLeaderId: string
  ) {
    const alliance = AllianceRepo.get(allianceId);
    if (!alliance) throw new Error("Alliance not found");

    if (actorId !== alliance.r5)
      throw new Error("Only R5 can transfer leadership");

    if (
      !alliance.r4.includes(newLeaderId) &&
      !alliance.r3.includes(newLeaderId)
    ) {
      throw new Error("New leader must be member");
    }

    await MutationGate.execute(
      {
        operation: "ALLIANCE_TRANSFER_LEADERSHIP",
        actor: actorId,
        allianceId,
        preState: alliance
      },
      async () => {
        alliance.r4 = alliance.r4.filter(id => id !== newLeaderId);
        alliance.r3 = alliance.r3.filter(id => id !== newLeaderId);

        alliance.r3.push(alliance.r5);
        alliance.r5 = newLeaderId;

        this.checkOrphanState(alliance);
        AllianceRepo.set(allianceId, alliance);
      },
      { requireAllianceLock: true }
    );
  }

  // -----------------------------
  // REMOVE MEMBER
  // -----------------------------
  static async removeMember(
    actorId: string,
    allianceId: string,
    userId: string
  ) {
    const alliance = AllianceRepo.get(allianceId);
    if (!alliance) throw new Error("Alliance not found");

    if (
      actorId !== alliance.r5 &&
      !alliance.r4.includes(actorId)
    ) {
      throw new Error("Insufficient permissions");
    }

    await MutationGate.execute(
      {
        operation: "ALLIANCE_REMOVE_MEMBER",
        actor: actorId,
        allianceId,
        preState: alliance
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

  // -----------------------------
  // DELETE REQUEST
  // -----------------------------
  static requestDelete(actorId: string, allianceId: string) {
    const alliance = AllianceRepo.get(allianceId);
    if (!alliance) throw new Error("Alliance not found");

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

  // -----------------------------
  // DELETE CONFIRM
  // -----------------------------
  static async confirmDelete(actorId: string, allianceId: string) {
    const pending = PendingDeletionRepo.get(allianceId);
    if (!pending) throw new Error("No deletion request found");

    if (pending.requestedBy !== actorId) {
      throw new Error("Only original requester can confirm");
    }

    const alliance = AllianceRepo.get(allianceId);
    if (!alliance) throw new Error("Alliance not found");

    await MutationGate.execute(
      {
        operation: "ALLIANCE_DELETE",
        actor: actorId,
        allianceId,
        preState: alliance
      },
      async () => {
        AllianceRepo.delete(allianceId);
        PendingDeletionRepo.delete(allianceId);
      },
      { requireGlobalLock: true }
    );
  }

  // -----------------------------
  // ORPHAN CHECK
  // -----------------------------
  static checkOrphanState(alliance: Alliance): boolean {
    if (!alliance.r5 && alliance.r4.length === 0 && alliance.r3.length === 0) {
      alliance.orphaned = true;
      return true;
    }

    alliance.orphaned = false;
    return false;
  }
}