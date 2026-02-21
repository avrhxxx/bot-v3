import { GlobalLock } from "../locks/GlobalLock";
import { AllianceLock } from "../locks/AllianceLock";
import { Journal } from "../journal/Journal";
import { SnapshotService } from "../system/snapshot/SnapshotService";
import { AllianceRepo } from "../data/Repositories";
import { Health } from "../system/Health";
import { SafeMode } from "../system/SafeMode";

interface MutationContext {
  operation: string;
  actor: string;
  allianceId?: string;
  preState?: any;
}

interface MutationOptions {
  requireGlobalLock?: boolean;
  requireAllianceLock?: boolean;
  systemOverride?: boolean;
}

export class MutationGate {
  static async execute(
    context: MutationContext,
    mutation: () => Promise<void> | void,
    options: MutationOptions = {}
  ) {
    if (SafeMode.isActive() && !options.systemOverride) {
      throw new Error("System is in Safe Mode");
    }

    const run = async () => {
      try {
        await mutation();

        // AFTER SUCCESSFUL MUTATION
        if (context.allianceId) {
          const alliance = AllianceRepo.get(context.allianceId);

          if (alliance) {
            // Create snapshot
            SnapshotService.createSnapshot(alliance);

            // Verify integrity immediately
            const valid = SnapshotService.verifySnapshot(alliance.id);

            if (!valid) {
              Health.setCritical(
                `Snapshot mismatch detected for alliance ${alliance.id}`
              );

              SafeMode.activate(
                `Integrity failure on alliance ${alliance.id}`
              );

              throw new Error("Snapshot integrity failure");
            }
          }
        }

        Journal.record({
          operation: context.operation,
          actor: context.actor,
          allianceId: context.allianceId,
          timestamp: Date.now()
        });

      } catch (error: any) {
        Journal.record({
          operation: "MUTATION_FAILED",
          actor: context.actor,
          allianceId: context.allianceId,
          timestamp: Date.now(),
          error: error.message
        });

        throw error;
      }
    };

    if (options.requireGlobalLock) {
      return GlobalLock.run(run);
    }

    if (options.requireAllianceLock && context.allianceId) {
      return AllianceLock.run(context.allianceId, run);
    }

    return run();
  }
}