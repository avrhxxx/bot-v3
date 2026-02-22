import { SnapshotService } from "./SnapshotService";
import { Health } from "../Health";
import { SafeMode } from "../SafeMode";
import { Journal } from "../../journal/Journal";
import { RepairService } from "./RepairService";

export class IntegrityMonitor {
  private static interval: NodeJS.Timeout | null = null;
  private static running = false;

  private static failureCount = 0;
  private static repairAttempts = 0;
  private static readonly MAX_REPAIR_ATTEMPTS = 2;

  static start(intervalMs: number = 10000) {
    if (this.interval) return;

    this.interval = setInterval(async () => {
      await this.runCheck();
    }, intervalMs);
  }

  static stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private static async runCheck() {
    if (this.running) return; // prevent overlap
    this.running = true;

    try {
      const corrupted = SnapshotService.verifyAll();

      if (corrupted.length === 0) {
        this.failureCount = 0;
        this.repairAttempts = 0;

        const current = Health.get();

        // 🔒 CRITICAL nie może być nadpisany automatycznie
        if (current.state === "WARNING") {
          Health.setHealthy();
        }

        return;
      }

      this.failureCount++;

      Journal.create({
        operation: "INTEGRITY_SCAN_FAILED",
        actor: "SYSTEM",
        timestamp: Date.now(),
        allianceId: undefined
      });

      if (this.failureCount === 1) {
        Health.setWarning(
          `Integrity issue detected in ${corrupted.length} alliance(s)`
        );
        return;
      }

      if (this.failureCount === 2) {
        Health.setCritical(
          `Integrity unstable – attempting repair`
        );

        if (this.repairAttempts < this.MAX_REPAIR_ATTEMPTS) {
          this.repairAttempts++;
          await RepairService.attemptRepair();
        }

        return;
      }

      if (this.failureCount >= 3) {
        Health.setCritical(
          `Integrity escalation – SafeMode activated`
        );

        SafeMode.activate("Integrity escalation threshold reached");
      }

    } finally {
      this.running = false;
    }
  }
}