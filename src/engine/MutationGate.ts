// File: src/engine/MutationGate.ts
/**
 * ============================================
 * ENGINE: MutationGate
 * FILE: src/engine/MutationGate.ts
 * ============================================
 *
 * RESPONSIBILITY:
 * - Atomic execution of operations
 * - Global and alliance-specific locks
 * - Journaling all operations
 *
 * NOTES:
 * - Removed SafeMode and Health
 * - All mutations in alliance system should use this
 * - Supports hierarchical locking:
 *    1️⃣ Global lock
 *    2️⃣ Alliance-specific lock
 *    3️⃣ No lock (local atomic execution)
 */

import { Journal } from "../journal/Journal";
import { GlobalLock } from "../locks/GlobalLock";
import { AllianceLock } from "../locks/AllianceLock";

export interface MutationOptions {
  allianceId?: string;            // Optional, used for alliance-specific locks
  actor: string;                  // Who initiates this mutation (user ID)
  operation: string;              // Operation name, e.g., "ALLIANCE_CREATE"
  requireGlobalLock?: boolean;    // Force global atomic lock
  requireAllianceLock?: boolean;  // Force alliance-specific atomic lock
  systemOverride?: boolean;       // If true, bypass normal permission checks
}

export class MutationGate {
  /**
   * Executes a mutation handler atomically with optional locks
   * @param options MutationOptions describing the operation
   * @param handler Async function performing the mutation
   */
  static async execute<T>(
    options: MutationOptions,
    handler: () => Promise<T> | T
  ): Promise<T> {

    // 1️⃣ Create journal entry at the start
    const journalEntry = Journal.create({
      operation: options.operation,
      actor: options.actor,
      allianceId: options.allianceId,
      timestamp: Date.now()
    });

    // 2️⃣ Wrap handler to update journal status
    const run = async (): Promise<T> => {
      try {
        const result = await handler();

        Journal.updateStatus(journalEntry.id, "EXECUTED");
        Journal.updateStatus(journalEntry.id, "CONFIRMED");

        return result;
      } catch (error: any) {
        Journal.updateStatus(journalEntry.id, "ABORTED", error?.message);
        throw error;
      }
    };

    // 3️⃣ Apply global lock if requested
    if (options.requireGlobalLock) {
      return GlobalLock.run(run);
    }

    // 4️⃣ Apply alliance-specific lock if requested
    if (options.requireAllianceLock && options.allianceId) {
      return AllianceLock.run(options.allianceId, run);
    }

    // 5️⃣ Run without external lock
    return run();
  }

  /**
   * Helper for running code atomically without specifying a lock
   */
  static async runAtomically<T>(handler: () => Promise<T> | T): Promise<T> {
    return MutationGate.execute({ actor: "SYSTEM", operation: "ATOMIC_RUN" }, handler);
  }
}