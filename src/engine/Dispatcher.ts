// src/engine/Dispatcher.ts
import { MutationGate, MutationOptions } from "./MutationGate";

export class Dispatcher {
  static async executeMutation<T>(
    options: MutationOptions,
    handler: () => Promise<T> | T
  ): Promise<T> {
    try {
      return await MutationGate.execute(options, handler);
    } catch (error: any) {
      console.error(`Dispatcher: Mutation "${options.operation}" failed:`, error);
      throw error;
    }
  }

  static async runAtomically<T>(handler: () => Promise<T> | T): Promise<T> {
    return MutationGate.execute({ actor: "SYSTEM", operation: "ATOMIC_RUN" }, handler);
  }
}