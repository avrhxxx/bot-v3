import { SnapshotService } from "./SnapshotService";
import { Health } from "../Health";
import { SafeMode } from "../SafeMode";
import { Journal } from "../../journal/Journal";

export class IntegrityMonitor {
  private static interval: NodeJS.Timeout | null = null;
  private static failureCount = 0;

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

    if (corrupted.length === 0) {
      this.failureCount = 0;
      return;
    }

    this.failureCount++;

    Journal.record({
      operation: "INTEGRITY_SCAN_FAILED",
      actor: "SYSTEM",
      timestamp: Date.now(),
      error: `Corrupted alliances: ${corrupted.join(", ")}`
    });

    if (this.failureCount === 1) {
      Health.setWarning(
        `Integrity issue detected in ${corrupted.length} alliance(s)`
      );
    }

    if (this.failureCount >= 3) {
      Health.setCritical(
        `Repeated integrity failure detected`
      );

      SafeMode.activate(
        `Integrity monitor escalation`
      );
    }
  }
}