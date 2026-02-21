import { HealthRepo } from "../data/Repositories";
import { MutationGate } from "../engine/MutationGate";

type SafeModeState = {
  enabled: boolean;
  reason?: string;
};

const KEY = "SAFE_MODE";

export class SafeMode {
  static isEnabled(): boolean {
    const state = HealthRepo.get(KEY);
    return state?.enabled ?? false;
  }

  static getState(): SafeModeState {
    return HealthRepo.get(KEY) ?? { enabled: false };
  }

  // ---------------------------
  // Manual activation
  // ---------------------------
  static async enable(actorId: string, reason: string) {
    await MutationGate.execute(
      {
        operation: "SAFE_MODE_ENABLE",
        actor: actorId,
        preState: this.getState()
      },
      async () => {
        HealthRepo.set(KEY, {
          enabled: true,
          reason
        });
      },
      {
        requireGlobalLock: true
      }
    );
  }

  // ---------------------------
  // Manual disable (STRICT)
  // ---------------------------
  static async disable(actorId: string, healthState: string) {
    if (healthState === "CRITICAL") {
      throw new Error("Cannot exit SAFE_MODE during CRITICAL state");
    }

    await MutationGate.execute(
      {
        operation: "SAFE_MODE_DISABLE",
        actor: actorId,
        preState: this.getState()
      },
      async () => {
        HealthRepo.set(KEY, {
          enabled: false
        });
      },
      {
        requireGlobalLock: true
      }
    );
  }

  // ---------------------------
  // System-triggered activation
  // (no permission logic here)
  // ---------------------------
  static async systemTrigger(reason: string) {
    const current = this.getState();
    if (current.enabled) return;

    HealthRepo.set(KEY, {
      enabled: true,
      reason
    });
  }
}