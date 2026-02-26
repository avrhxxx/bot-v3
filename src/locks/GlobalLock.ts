// src/locks/GlobalLock.ts
export class GlobalLock {
  static async run<T>(handler: () => Promise<T> | T): Promise<T> {
    return handler();
  }
}