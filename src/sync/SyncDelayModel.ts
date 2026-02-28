// src/sync/SyncDelayModel.ts
export class DelayModel {
  private baseActionDelay: number; // ms między pojedynczymi operacjami w unitach
  private baseUnitDelay: number;   // ms między unitami w cyklu
  private baseCycleDelay: number;  // ms między cyklami
  private dynamicFactor: number;   // mnożnik obciążenia
  private activeOperations: number; // ile operacji w tej chwili trwa
  private freeze: boolean;         // czy EventUnit zamroził synchronizację

  constructor(baseAction = 300, baseUnit = 2000, baseCycle = 60000) {
    this.baseActionDelay = baseAction;
    this.baseUnitDelay = baseUnit;
    this.baseCycleDelay = baseCycle;
    this.dynamicFactor = 1;
    this.activeOperations = 0;
    this.freeze = false;
  }

  // --- ustawienia dynamiczne ---
  public startOperation() {
    this.activeOperations += 1;
  }

  public finishOperation() {
    this.activeOperations = Math.max(0, this.activeOperations - 1);
  }

  public setFreeze(freeze: boolean) {
    this.freeze = freeze;
  }

  // --- obliczanie delay ---
  public getActionDelay(): number {
    if (this.freeze) return this.baseActionDelay * 5; // maksymalne opóźnienie przy freeze
    return this.baseActionDelay * (1 + this.dynamicFactor * this.activeOperations);
  }

  public getUnitDelay(): number {
    if (this.freeze) return this.baseUnitDelay * 3;
    return this.baseUnitDelay * (1 + this.dynamicFactor * (this.activeOperations / 2));
  }

  public getCycleDelay(): number {
    if (this.freeze) return this.baseCycleDelay * 2;
    return this.baseCycleDelay * (1 + this.dynamicFactor * (this.activeOperations / 4));
  }

  // --- aktualizacja dynamicznego czynnika po cyklu ---
  public updateDynamicFactor(newFactor: number) {
    this.dynamicFactor = Math.max(0.5, Math.min(newFactor, 3)); // ograniczenie 0.5 - 3x
  }

  // --- wygodna funkcja delay ---
  public async delay(ms: number) {
    return new Promise(res => setTimeout(res, ms));
  }

  // --- kombinowana funkcja delay dla akcji w unitach ---
  public async waitAction() {
    const delayMs = this.getActionDelay();
    await this.delay(delayMs);
    return delayMs;
  }

  public async waitUnit() {
    const delayMs = this.getUnitDelay();
    await this.delay(delayMs);
    return delayMs;
  }

  public async waitCycle() {
    const delayMs = this.getCycleDelay();
    await this.delay(delayMs);
    return delayMs;
  }
}