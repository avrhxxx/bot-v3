export class GlobalLock {
  private static locked = false;
  private static owner: string | null = null;
  private static expiresAt: number | null = null;

  static acquire(ownerId: string, timeoutMs = 5000): boolean {
    const now = Date.now();

    if (this.locked && this.expiresAt && now < this.expiresAt) {
      return false;
    }

    this.locked = true;
    this.owner = ownerId;
    this.expiresAt = now + timeoutMs;

    return true;
  }

  static release(ownerId: string): void {
    if (!this.locked) return;
    if (this.owner !== ownerId) {
      throw new Error("GlobalLock release denied: not owner");
    }

    this.locked = false;
    this.owner = null;
    this.expiresAt = null;
  }

  static isLocked(): boolean {
    if (!this.locked) return false;
    if (this.expiresAt && Date.now() > this.expiresAt) {
      this.locked = false;
      this.owner = null;
      this.expiresAt = null;
      return false;
    }
    return true;
  }

  static async run<T>(
    handler: () => Promise<T> | T,
    ownerId = "system"
  ): Promise<T> {
    const acquired = this.acquire(ownerId);
    if (!acquired) {
      throw new Error("GlobalLock already acquired");
    }

    try {
      return await handler();
    } finally {
      this.release(ownerId);
    }
  }
}