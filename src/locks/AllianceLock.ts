// src/locks/AllianceLock.ts
export class AllianceLock {
  static async run<T>(allianceId: string, handler: () => Promise<T> | T): Promise<T> {
    return handler();
  }
}