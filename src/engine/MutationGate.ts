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
 * - Owner logic moved to Ownership.ts
 * - Use this for all mutation operations in alliance system
 * - Supports both global and alliance-specific atomic locks
 *
 * ============================================
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

/**
 * ============================
 * CLASS: MutationGate
 * ============================
 *
 * - Ensures atomic execution for any mutation in the alliance system.
 * - Logs each mutation to Journal (status: EXECUTED, CONFIRMED, ABORTED)
 * - Supports hierarchical locking:
 *   1️⃣ Global lock
 *   2️⃣ Alliance-specific lock
 *   3️⃣ No lock (local atomic execution)
 *
 * ============================
 */
export class MutationGate {

  /**
   * Executes a mutation handler atomically with optional locks
   * @param options MutationOptions describing the operation
   * @param handler Async function performing the mutation
   * @returns The result of the handler
   */
  static async execute<T>(
    options: MutationOptions,
    handler: () => Promise<T> | T
  ): Promise<T> {

    // 1️⃣ Create a journal entry at the start
    const journalEntry = Journal.create({
      operation: options.operation,
      actor: options.actor,
      allianceId: options.allianceId,
      timestamp: Date.now()
    });

    // 2️⃣ Wrap the handler to update journal status
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

    // 4️⃣ Apply alliance-specific lock if requested and allianceId provided
    if (options.requireAllianceLock && options.allianceId) {
      return AllianceLock.run(options.allianceId, run);
    }

    // 5️⃣ Otherwise run without external lock
    return run();
  }

  /**
   * Helper for atomic execution within an already running atomic context
   * Example: RoleModule.promote / demote
   */
  static async runAtomically<T>(handler: () => Promise<T> | T): Promise<T> {
    return run();
  }
}

/**
 * ============================================
 * EXAMPLES OF USAGE
 * ============================================
 *
 * 1️⃣ Alliance Create (from allianceCreate.ts)
 * --------------------------------------------
 * await MutationGate.execute(
 *   { operation: "ALLIANCE_CREATE", actor: userId, requireGlobalLock: true },
 *   async () => {
 *     // create roles/channels + persist domain object
 *   }
 * );
 *
 * 2️⃣ Alliance Delete (from allianceDelete.ts)
 * --------------------------------------------
 * await MutationGate.execute(
 *   { operation: "ALLIANCE_DELETE", actor: userId, requireGlobalLock: true },
 *   async () => {
 *     // remove infrastructure + delete repository entry
 *   }
 * );
 *
 * 3️⃣ Set Leader (from setLeader.ts)
 * --------------------------------------------
 * await MutationGate.execute(
 *   { operation: "SET_LEADER", actor: userId, requireAllianceLock: true, allianceId },
 *   async () => {
 *     // transfer leadership via TransferLeaderSystem
 *   }
 * );
 */