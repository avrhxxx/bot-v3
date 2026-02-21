interface AllianceLockState {
  owner: string;
  expiresAt: number;
}

export class AllianceLock {
  private static locks: Map<string, AllianceLockState> = new Map();

  static acquire(
    allianceId: string,
    ownerId: string,
    timeoutMs = 5000
  ): boolean {
    const now = Date.now();
    const existing = this.locks.get(allianceId);

    if (existing && now < existing.expiresAt) {
      return false;
    }

    this.locks.set(allianceId, {
      owner: ownerId,
      expiresAt: now + timeoutMs
    });

    return true;
  }

  static release(allianceId: string, ownerId: string): void {
    const existing = this.locks.get(allianceId);
    if (!existing) return;

    if (existing.owner !== ownerId) {
      throw new Error("AllianceLock release denied: not owner");
    }

    this.locks.delete(allianceId);
  }

  static isLocked(allianceId: string): boolean {
    const existing = this.locks.get(allianceId);
    if (!existing) return false;

    if (Date.now() > existing.expiresAt) {
      this.locks.delete(allianceId);
      return false;
    }

    return true;
  }

  static async run<T>(
    allianceId: string,
    handler: () => Promise<T> | T,
    ownerId = "system"
  ): Promise<T> {
    const acquired = this.acquire(allianceId, ownerId);
    if (!acquired) {
      throw new Error("AllianceLock already acquired");
    }

    try {
      return await handler();
    } finally {
      this.release(allianceId, ownerId);
    }
  }
}