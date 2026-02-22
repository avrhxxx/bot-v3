// src/system/TimeModule/TimeModule.ts

type TickCallback = (timestamp: number) => void;

export class TimeModule {
  private static instance: TimeModule;
  private tickInterval: NodeJS.Timeout | null = null;
  private tickRateMs: number = 1000; // 1s default
  private callbacks: Set<TickCallback> = new Set();

  private constructor() {}

  public static getInstance(): TimeModule {
    if (!this.instance) {
      this.instance = new TimeModule();
    }
    return this.instance;
  }

  /**
   * Start the system tick
   */
  public start(tickRateMs: number = 1000) {
    this.tickRateMs = tickRateMs;
    if (this.tickInterval) return; // already running

    this.tickInterval = setInterval(() => {
      const timestamp = Date.now();
      for (const cb of this.callbacks) {
        try {
          cb(timestamp);
        } catch (err) {
          console.error("TimeModule callback error:", err);
        }
      }
    }, this.tickRateMs);

    console.log(`⏱ TimeModule started with tick rate ${this.tickRateMs}ms`);
  }

  /**
   * Stop the system tick
   */
  public stop() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
      console.log("⏱ TimeModule stopped");
    }
  }

  /**
   * Register a callback to be called on every tick
   */
  public onTick(callback: TickCallback) {
    this.callbacks.add(callback);
  }

  /**
   * Remove a registered callback
   */
  public removeTickCallback(callback: TickCallback) {
    this.callbacks.delete(callback);
  }

  /**
   * Delay utility (async)
   */
  public async delay(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get current system timestamp
   */
  public now(): number {
    return Date.now();
  }
}