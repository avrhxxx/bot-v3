import { Database } from "../data/Database";

export type HealthState = "HEALTHY" | "WARNING" | "CRITICAL";

interface HealthRecord {
  state: HealthState;
  reason: string | null;
}

const KEY = "system-health";

export class Health {
  static setHealthy() {
    Database.system.set(KEY, {
      state: "HEALTHY",
      reason: null
    } satisfies HealthRecord);
  }

  static setWarning(reason: string) {
    Database.system.set(KEY, {
      state: "WARNING",
      reason
    } satisfies HealthRecord);
  }

  static setCritical(reason: string) {
    Database.system.set(KEY, {
      state: "CRITICAL",
      reason
    } satisfies HealthRecord);
  }

  static get(): HealthRecord {
    return (
      Database.system.get(KEY) ?? {
        state: "HEALTHY",
        reason: null
      }
    );
  }
}