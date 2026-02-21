import { SnapshotService } from "./SnapshotService";
import { Health } from "../Health";
import { SafeMode } from "../SafeMode";
import { Journal } from "../../journal/Journal";
import { RepairService } from "./RepairService";

export class IntegrityMonitor {
  private static interval: NodeJS.Timeout | null = null;

  private static failureCount = 0;
  private static repairAttempts = 0;
  private static readonly MAX_REPAIR_ATTEMPTS = 2;

  static start(intervalMs: number = 10000) {
    if (this.interval) return;

    this.interval = setInterval(() => {
      this.runCheck();
    }, intervalMs);
  }

  static stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private static runCheck() {
    const corrupted = SnapshotService.verifyAll();

    // ✅ SYSTEM OK
    if (corrupted.length === 0) {
      this.failureCount = 0;
      this.repairAttempts = 0;

      const current = Health.get();
      if (current.state !== "HEALTHY") {
        Health.setHealthy();
      }

      return;
    }

    // ❌ SYSTEM NOT OK
    this.failureCount++;

    Journal.create({
      operation: "INTEGRITY_SCAN_FAILED",
      actor: "SYSTEM",
      timestamp: Date.now(),
      allianceId: undefined
    });

    // 1️⃣ First failure → WARNING
    if (this.failureCount === 1) {
      Health.setWarning(
        `Integrity issue detected in ${corrupted.length} alliance(s)`
      );
      return;
    }

    // 2️⃣ Second failure → CRITICAL + attempt repair
    if (this.failureCount === 2) {
      Health.setCritical(
        `Integrity unstable – attempting repair`
      );

      if (this.repairAttempts < this.MAX_REPAIR_ATTEMPTS) {
        this.repairAttempts++;
        RepairService.attemptRepair();
      }

      return;
    }

    // 3️⃣ Third failure → SafeMode
    if (this.failureCount >= 3) {
      Health.setCritical(
        `Integrity escalation – SafeMode activated`
      );

      SafeMode.activate("Integrity escalation threshold reached");
    }
  }
}