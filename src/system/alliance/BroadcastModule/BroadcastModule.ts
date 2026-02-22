type Listener = (...args: any[]) => void;

export class BroadcastModule {
  private static listeners: Record<string, Listener[]> = {};

  /**
   * Subskrybuje zdarzenie
   */
  static on(event: string, listener: Listener) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
  }

  /**
   * Emituje zdarzenie
   */
  static emit(event: string, ...args: any[]) {
    const eventListeners = this.listeners[event] ?? [];
    for (const listener of eventListeners) {
      try {
        listener(...args);
      } catch (error) {
        console.error(`BroadcastModule: error in listener for event '${event}'`, error);
      }
    }
  }

  /**
   * Usuwa listener dla zdarzenia
   */
  static off(event: string, listener?: Listener) {
    if (!this.listeners[event]) return;
    if (!listener) {
      delete this.listeners[event];
    } else {
      this.listeners[event] = this.listeners[event].filter(l => l !== listener);
    }
  }

  /**
   * Czyści wszystkie listener'y (przydatne do testów/redeploy)
   */
  static clearAll() {
    this.listeners = {};
  }
}