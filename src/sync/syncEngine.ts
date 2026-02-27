export class SyncEngine {
  private tasks: (() => Promise<void>)[] = [];

  registerTask(task: () => Promise<void>) {
    this.tasks.push(task);
  }

  start(interval: number = 15000) {
    setInterval(async () => {
      console.log("🔄 [SyncEngine] Placeholder cycle running...");
      for (const task of this.tasks) {
        try {
          await task();
        } catch (err) {
          console.error("❌ [SyncEngine] Task error:", err);
        }
      }
      console.log("✅ [SyncEngine] Placeholder cycle finished");
    }, interval);
  }
}