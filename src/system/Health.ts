import { HealthRepo } from "../data/Repositories";
import { MutationGate } from "../engine/MutationGate";
import { SafeMode } from "./SafeMode";

export type HealthState = "HEALTHY" | "DEGRADED" | "CRITICAL";

const KEY = "SYSTEM_HEALTH";

export class Health {
  // -----------------------
  // Get current state
  // -----------------------
  static getState(): HealthState {
    return HealthRepo.get(KEY) ?? "HEALTHY";
  }

  static isHealthy(): boolean {
    return this.getState() === "HEALTHY";
  }

  static isCritical(): boolean {
    return this.getState() === "CRITICAL";
  }

  // -----------------------
  // Update health state
  // -----------------------
  static async setState(
    actorId: string,
    newState: HealthState,
    reason: string
  ) {
    const current = this.getState();

    if (current === newState) return;

    await MutationGate.execute(
      {
        operation: "HEALTH_STATE_CHANGE",
        actor: actorId,
        preState: { current },
        postState: { newState },
        metadata: { reason }
      },
      async () => {
        HealthRepo.set(KEY, newState);
      },
      {
        requireGlobalLock: true
      }
    );

    // CRITICAL auto-triggers SAFE_MODE
    if (newState === "CRITICAL" && !SafeMode.isEnabled()) {
      await SafeMode.systemTrigger(
        "Health escalated to CRITICAL"
      );
    }
  }
}