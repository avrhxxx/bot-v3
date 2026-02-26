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
 * - SafeMode, Health, SnapshotService removed
 * - Owner logic moved to ownership.ts
 * - Use for all mutations in alliance system
 *
 * ============================================
 */

import { Journal } from "../journal/Journal";
import { GlobalLock } from "../locks/GlobalLock";
import { AllianceLock } from "../locks/AllianceLock";

export interface MutationOptions {
  allianceId?: string;
  actor: string;
  operation: string;
  requireGlobalLock?: boolean;
  requireAllianceLock?: boolean;
  systemOverride?: boolean;
}

export class MutationGate {
  static async execute<T>(
    options: MutationOptions,
    handler: () => Promise<T> | T
  ): Promise<T> {
    const journalEntry = Journal.create({
      operation: options.operation,
      actor: options.actor,
      allianceId: options.allianceId,
      timestamp: Date.now()
    });

    const run = async () => {
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

    if (options.requireGlobalLock) {
      return GlobalLock.run(run);
    }

    if (options.requireAllianceLock && options.allianceId) {
      return AllianceLock.run(options.allianceId, run);
    }

    return run();
  }
}