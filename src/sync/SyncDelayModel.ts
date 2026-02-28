
// src/sync/SyncDelayModel.ts
export class DelayModel {
  private minActionDelay = 200;  // minimalny delay między operacjami w ms
  private maxActionDelay = 1000; // maksymalny delay między operacjami
  private minUnitDelay = 2000;    // minimalny delay między unitami
  private maxUnitDelay = 5000;    // maksymalny delay między unitami
  private defaultCycleDelay = 60_000; // standardowy delay między cyklami w ms

  constructor() {
    // Możemy w przyszłości pobierać konfigurację z DB lub ENV
  }

  // ============================
  // Delay między pojedynczymi akcjami w unitach
  // ============================
  public getActionDelay(unitName: string, operationsCount = 1): number {
    // Prosty algorytm: im więcej operacji, tym krótszy delay, żeby szybciej skończyć cykl
    const baseDelay = this.minActionDelay + Math.random() * (this.maxActionDelay - this.minActionDelay);
    const dynamicFactor = 1 / Math.sqrt(operationsCount); 
    return Math.round(baseDelay * dynamicFactor);
  }

  // ============================
  // Delay między unitami w cyklu
  // ============================
  public getUnitDelay(unitName: string): number {
    // Można różnicować delay per unit
    switch (unitName) {
      case "ControlUnit": return this.minUnitDelay; // priorytetowy, ma krótki delay
      case "RoleUnit": return 3000 + Math.random() * 2000;
      case "ChannelUnit": return 3000 + Math.random() * 2000;
      case "PermsUnit": return 2000 + Math.random() * 3000;
      default: return this.minUnitDelay + Math.random() * (this.maxUnitDelay - this.minUnitDelay);
    }
  }

  // ============================
  // Delay między pełnymi cyklami synchronizacji
  // ============================
  public getCycleDelay(pendingOperationsCount = 0): number {
    // Więcej operacji → dłuższy czas między cyklami, żeby nie przeciążyć API
    const factor = 1 + pendingOperationsCount / 20;
    return Math.round(this.defaultCycleDelay * factor);
  }
}