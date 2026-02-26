// File: src/engine/Dispatcher.ts
/**
 * ============================================
 * ENGINE: Dispatcher
 * FILE: src/engine/Dispatcher.ts
 * ============================================
 *
 * RESPONSIBILITY:
 * - Executes mutations safely
 * - Handles journal logging
 * - Supports global and alliance-specific locks
 *
 * CHANGES:
 * - Removed SafeMode, Health, SnapshotService
 * - All mutations go through MutationGate
 */

import { MutationGate, MutationOptions } from "./MutationGate";
import { Journal } from "../journal/Journal";
import { GlobalLock } from "../locks/GlobalLock";
import { AllianceLock } from "../locks/AllianceLock";

export class Dispatcher {
  /**
   * Execute a mutation atomically using MutationGate
   * @param options MutationOptions describing the operation
   * @param handler Async function performing the mutation
   */
  static async executeMutation<T>(
    options: MutationOptions,
    handler: () => Promise<T> | T
  ): Promise<T> {
    try {
      const result = await MutationGate.execute(options, handler);
      return result;
    } catch (error: any) {
      console.error(`Dispatcher: Mutation "${options.operation}" failed:`, error);
      throw error;
    }
  }

  /**
   * Helper for running any code atomically without specifying a lock
   */
  static async runAtomically<T>(handler: () => Promise<T> | T): Promise<T> {
    return MutationGate.execute({ actor: "SYSTEM", operation: "ATOMIC_RUN" }, handler);
  }
}