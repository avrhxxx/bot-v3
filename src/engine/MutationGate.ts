import { Journal } from "../journal/Journal";
import { GlobalLock } from "../locks/GlobalLock";
import { AllianceLock } from "../locks/AllianceLock";
import { SafeMode } from "../system/SafeMode";
import { Health } from "../system/Health";

interface MutationContext {
  operation: string;
  actor: string;
  allianceId?: string;
  preState?: any;
  postState?: any;
  metadata?: any;
}

interface MutationOptions {
  requireGlobalLock?: boolean;
  requireAllianceLock?: boolean;
  systemOverride?: boolean; // 🔥 new
}

export class MutationGate {
  static async execute(
    context: MutationContext,
    mutationFn: () => Promise<void>,
    options?: MutationOptions
  ) {
    // ----------------------------------
    // 🔥 SYSTEM ENFORCEMENT
    // ----------------------------------

    if (!options?.systemOverride) {
      if (SafeMode.isEnabled()) {
        throw new Error("System is in SAFE_MODE");
      }

      if (Health.isCritical()) {
        throw new Error("System health is CRITICAL");
      }
    }

    // ----------------------------------
    // 🔒 LOCKS
    // ----------------------------------

    if (options?.requireGlobalLock) {
      if (GlobalLock.isLocked()) {
        throw new Error("Global lock active");
      }
      GlobalLock.lock();
    }

    if (options?.requireAllianceLock && context.allianceId) {
      if (AllianceLock.isLocked(context.allianceId)) {
        throw new Error("Alliance lock active");
      }
      AllianceLock.lock(context.allianceId);
    }

    try {
      await mutationFn();

      Journal.record({
        operation: context.operation,
        actor: context.actor,
        allianceId: context.allianceId,
        preState: context.preState,
        postState: context.postState,
        metadata: context.metadata
      });
    } finally {
      if (options?.requireGlobalLock) {
        GlobalLock.unlock();
      }

      if (options?.requireAllianceLock && context.allianceId) {
        AllianceLock.unlock(context.allianceId);
      }
    }
  }
}