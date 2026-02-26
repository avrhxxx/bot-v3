// src/engine/MutationGate.ts

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
    console.log(`[MutationGate] executing ${options.operation}`);
    return handler();
  }
}