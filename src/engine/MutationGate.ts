// src/engine/MutationGate.ts
export class MutationGate {
  static async execute<T>(options: any, handler: () => Promise<T> | T): Promise<T> {
    console.log(`[MutationGate] executing ${options.operation}`);
    return handler();
  }
}