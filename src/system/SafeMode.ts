class SafeModeState {
  active: boolean = false;
  reason: string | null = null;
}

const state = new SafeModeState();

export class SafeMode {
  static activate(reason: string): void {
    state.active = true;
    state.reason = reason;
  }

  static deactivate(): void {
    state.active = false;
    state.reason = null;
  }

  static isActive(): boolean {
    return state.active;
  }

  static getReason(): string | null {
    return state.reason;
  }
}