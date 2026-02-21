import { db } from "../data/Database";

export type HealthState = "HEALTHY" | "WARNING" | "CRITICAL";

interface HealthRecord {
  state: HealthState;
  reason: string | null;
}

const KEY = "system-health";

export class Health {
  static setHealthy() {
    db.health.set(KEY, {
      state: "HEALTHY",
      reason: null
    } satisfies HealthRecord);
  }

  static setWarning(reason: string) {
    db.health.set(KEY, {
      state: "WARNING",
      reason
    } satisfies HealthRecord);
  }

  static setCritical(reason: string) {
    db.health.set(KEY, {
      state: "CRITICAL",
      reason
    } satisfies HealthRecord);
  }

  static get(): HealthRecord {
    return (
      db.health.get(KEY) ?? {
        state: "HEALTHY",
        reason: null
      }
    );
  }
}