import { SafeMode } from "../system/SafeMode";
import { Journal } from "../journal/Journal";
import { SnapshotService } from "../system/snapshot/SnapshotService";
import { Health } from "../system/Health";

export interface MutationOptions {
  allianceId?: string;
  actor: string;
  operation: string;
  systemOverride?: boolean;
}

export class MutationGate {
  static execute<T>(
    options: MutationOptions,
    handler: () => T
  ): T {
    if (SafeMode.isActive() && !options.systemOverride) {
      throw new Error("System in SafeMode");
    }

    const journalEntry = Journal.create({
      operation: options.operation,
      actor: options.actor,
      allianceId: options.allianceId,
      timestamp: Date.now()
    });

    try {
      const result = handler();

      if (options.allianceId) {
        const alliance = SnapshotService.getAlliance(options.allianceId);
        if (alliance) {
          SnapshotService.createSnapshot(alliance);

          const valid = SnapshotService.verifySnapshot(
            options.allianceId
          );

          if (!valid) {
            Health.setCritical(
              "Immediate post-mutation integrity failure"
            );

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
      Journal.updateStatus(
        journalEntry.id,
        "ABORTED",
        error?.message
      );
      throw error;
    }
  }
}