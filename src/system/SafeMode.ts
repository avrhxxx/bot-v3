let active = false;
let reason: string | null = null;

export class SafeMode {
  static activate(r: string) {
    active = true;
    reason = r;
  }

  static deactivate() {
    active = false;
    reason = null;
  }

  static isActive() {
    return active;
  }

  static getReason() {
    return reason;
  }
}