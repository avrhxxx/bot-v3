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
    if (existing) {
      throw new Error("Alliance already exists");
    }

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
      {
        requireGlobalLock: true
      }
    );
  }

  // -----------------------------
  // DELETE REQUEST (STEP 1)
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
  // DELETE CONFIRM (STEP 2)
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
      {
        requireGlobalLock: true
      }
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

  // -----------------------------
  // FORCE ORPHAN (system repair tool)
  // -----------------------------
  static async markOrphan(
    actorId: string,
    allianceId: string
  ) {
    const alliance = AllianceRepo.get(allianceId);
    if (!alliance) throw new Error("Alliance not found");

    await MutationGate.execute(
      {
        operation: "ALLIANCE_ORPHAN_MARK",
        actor: actorId,
        allianceId,
        preState: alliance
      },
      async () => {
        alliance.orphaned = true;
        AllianceRepo.set(allianceId, alliance);
      },
      {
        requireGlobalLock: true,
        systemOverride: true
      }
    );
  }
}