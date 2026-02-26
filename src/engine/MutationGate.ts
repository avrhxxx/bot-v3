export interface MutationOptions {
  allianceId?: string;
  actor: string;
  operation: string;
  requireGlobalLock?: boolean;
  requireAllianceLock?: boolean;
  systemOverride?: boolean;
}

export class MutationGate {
  static async execute<T>(options: MutationOptions, handler: () => Promise<T> | T): Promise<T> {
    console.log(`[MutationGate] Executing ${options.operation} by ${options.actor}`);
    return handler();
  }

  static async runAtomically<T>(handler: () => Promise<T> | T): Promise<T> {
    return MutationGate.execute({ actor: 'SYSTEM', operation: 'ATOMIC_RUN' }, handler);
  }
}