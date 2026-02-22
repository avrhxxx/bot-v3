import crypto from "crypto";
import { SafeMode } from "../system/SafeMode";
import { Journal } from "../journal/Journal";
import { SnapshotService } from "../system/snapshot/SnapshotService";
import { Health } from "../system/Health";
import { AllianceRepo } from "../data/Repositories";
import { GlobalLock } from "../locks/GlobalLock";
import { AllianceLock } from "../locks/AllianceLock";

export interface MutationOptions {
  allianceId?: string;
  actor: string;
  operation: string;
  requireGlobalLock?: boolean;
  requireAllianceLock?: boolean;
  systemOverride?: boolean;
}

export class MutationGate {
  static async execute<T>(
    options: MutationOptions,
    handler: () => Promise<T> | T
  ): Promise<T> {
    if (SafeMode.isActive() && !options.systemOverride) {
      throw new Error("System in SafeMode");
    }

    const preStateHash = options.allianceId
      ? this.computePreStateHash(options.allianceId)
      : undefined;

    const journalEntry = Journal.create({
      operation: options.operation,
      actor: options.actor,
      allianceId: options.allianceId,
      timestamp: Date.now(),
      preStateHash
    });

    const run = async () => {
      try {
        const result = await handler();

        if (options.allianceId) {
          const alliance = AllianceRepo.get(options.allianceId);
          if (alliance) {
            SnapshotService.createSnapshot(alliance);

            const valid = SnapshotService.verifySnapshot(options.allianceId);
            if (!valid) {
              Health.setCritical("Immediate post-mutation integrity failure");

              Journal.updateStatus(
                journalEntry.id,
                "ABORTED",
                "Integrity check failed"
              );

              throw new Error("Integrity check failed");
            }
          }
        }

        Journal.updateStatus(journalEntry.id, "EXECUTED");
        Journal.updateStatus(journalEntry.id, "CONFIRMED");

        return result;
      } catch (error: any) {
        Journal.updateStatus(journalEntry.id, "ABORTED", error?.message);
        throw error;
      }
    };

    if (options.requireGlobalLock) {
      return GlobalLock.run(run);
    }

    if (options.requireAllianceLock && options.allianceId) {
      return AllianceLock.run(options.allianceId, run);
    }

    return run();
  }

  private static computePreStateHash(allianceId: string): string {
    const alliance = AllianceRepo.get(allianceId);
    if (!alliance) return "";

    const raw = JSON.stringify(alliance);
    return crypto.createHash("sha256").update(raw).digest("hex");
  }
}