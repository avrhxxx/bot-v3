import { GlobalLock } from "../locks/GlobalLock";
import { AllianceLock } from "../locks/AllianceLock";
import { Journal } from "../journal/Journal";

interface MutationContext {
  operation: string;
  actor: string;
  target?: string;
  allianceId?: string;
  preState: unknown;
}

interface MutationOptions {
  requireGlobalLock?: boolean;
  requireAllianceLock?: boolean;
  lockTimeoutMs?: number;
}

export class MutationGate {
  static async execute(
    context: MutationContext,
    mutationFn: () => Promise<void> | void,
    options: MutationOptions = {}
  ) {
    const {
      requireGlobalLock = false,
      requireAllianceLock = false,
      lockTimeoutMs = 5000
    } = options;

    const ownerId = context.actor;

    // -----------------------
    // 1. Acquire locks (hierarchy enforced)
    // -----------------------

    if (requireGlobalLock) {
      const acquired = GlobalLock.acquire(ownerId, lockTimeoutMs);
      if (!acquired) {
        throw new Error("Global lock acquisition failed");
      }
    }

    if (requireAllianceLock && context.allianceId) {
      const acquired = AllianceLock.acquire(
        context.allianceId,
        ownerId,
        lockTimeoutMs
      );
      if (!acquired) {
        if (requireGlobalLock) {
          GlobalLock.release(ownerId);
        }
        throw new Error("Alliance lock acquisition failed");
      }
    }

    // -----------------------
    // 2. Journal PENDING
    // -----------------------

    const preHash = Journal.computeHash(context.preState);

    const entry = Journal.create({
      operation: context.operation,
      actor: context.actor,
      target: context.target,
      alliance_id: context.allianceId,
      pre_state_hash: preHash
    });

    try {
      // -----------------------
      // 3. Execute mutation
      // -----------------------

      await mutationFn();

      // -----------------------
      // 4. Journal EXECUTED → CONFIRMED
      // -----------------------

      Journal.updateStatus(entry.id, "EXECUTED");
      Journal.updateStatus(entry.id, "CONFIRMED");
    } catch (err) {
      // -----------------------
      // 5. Abort
      // -----------------------

      Journal.updateStatus(entry.id, "ABORTED");

      throw err;
    } finally {
      // -----------------------
      // 6. Release locks (reverse order)
      // -----------------------

      if (requireAllianceLock && context.allianceId) {
        try {
          AllianceLock.release(context.allianceId, ownerId);
        } catch {}
      }

      if (requireGlobalLock) {
        try {
          GlobalLock.release(ownerId);
        } catch {}
      }
    }
  }
}