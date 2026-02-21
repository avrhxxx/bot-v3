import { MutationGate } from "../../engine/MutationGate";
import { AllianceRepo } from "../../data/Repositories";
import { Alliance } from "./AllianceTypes";
import { Ownership } from "../../system/Ownership";

export class AllianceService {
  static async createAlliance(
    actorId: string,
    allianceId: string,
    name: string
  ) {
    // Permission: only Discord Owner can create alliance
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
          createdAt: Date.now()
        };

        AllianceRepo.set(allianceId, alliance);
      },
      {
        requireGlobalLock: true
      }
    );
  }
}