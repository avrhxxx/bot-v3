import { HealthRepo } from "../data/Repositories";

type HealthState = "HEALTHY" | "WARNING" | "CRITICAL";

export class Health {
  static get(): HealthState {
    return HealthRepo.get("state") || "HEALTHY";
  }

  static setHealthy() {
    HealthRepo.set("state", "HEALTHY");
  }

  static setWarning(reason: string) {
    HealthRepo.set("state", "WARNING");
    HealthRepo.set("reason", reason);
  }

  static setCritical(reason: string) {
    HealthRepo.set("state", "CRITICAL");
    HealthRepo.set("reason", reason);
  }

  static getReason(): string | undefined {
    return HealthRepo.get("reason");
  }
}