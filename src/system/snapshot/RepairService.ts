import { AllianceRepo, SnapshotRepo } from "../../data/Repositories";
import { SnapshotService } from "./SnapshotService";
import { Health } from "../Health";
import { SafeMode } from "../SafeMode";
import { Journal } from "../../journal/Journal";

export class RepairService {
  static attemptRepair(): boolean {
    const corrupted = SnapshotService.verifyAll();

    if (corrupted.length === 0) {
      return false;
    }

    let repairedCount = 0;

    for (const allianceId of corrupted) {
      const snapshot = SnapshotRepo.get(allianceId);
      const alliance = AllianceRepo.get(allianceId);

      if (!snapshot || !alliance) continue;

      try {
        // Minimal structural restore
        alliance.r4 = alliance.r4.slice(0, snapshot.r4Count);
        alliance.r3 = alliance.r3.slice(0, snapshot.r3Count);
        alliance.orphaned = snapshot.orphaned;

        // Recreate snapshot after repair
        SnapshotService.createSnapshot(alliance);

        const valid = SnapshotService.verifySnapshot(allianceId);

        if (valid) {
          repairedCount++;
        }
      } catch (error: any) {
        Journal.record({
          operation: "REPAIR_FAILED",
          actor: "SYSTEM",
          allianceId,
          timestamp: Date.now(),
          error: error.message
        });
      }
    }

    if (repairedCount > 0) {
      Journal.record({
        operation: "REPAIR_SUCCESS",
        actor: "SYSTEM",
        timestamp: Date.now(),
        error: `Repaired ${repairedCount} alliance(s)`
      });

      Health.setHealthy();
      SafeMode.deactivate?.();

      return true;
    }

    return false;
  }
}