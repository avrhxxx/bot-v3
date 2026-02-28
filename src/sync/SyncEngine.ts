// src/sync/SyncEngine.ts
import { Guild } from "discord.js";
import { DelayModel } from "./SyncDelayModel";

// Typ jednostki
export interface Unit {
  name: string;
  // Każdy unit dostaje guild i DelayModel, żeby móc korzystać z delayów podczas operacji
  run: (guild: Guild, delayModel: DelayModel) => Promise<void>;
}

export class SyncEngine {
  private guild: Guild;
  private delayModel: DelayModel;
  private units: Unit[];
  private isRunning: boolean;

  constructor(guild: Guild, units: Unit[], delayModel: DelayModel) {
    this.guild = guild;
    this.units = units;
    this.delayModel = delayModel;
    this.isRunning = false;
  }

  // Start cyklu synchronizacji
  public async start() {
    if (this.isRunning) return;
    this.isRunning = true;

    console.log("[SyncEngine] Sync engine started.");

    while (this.isRunning) {
      console.log("[SyncEngine] Starting new sync cycle...");

      // --- Uruchamianie unitów kolejno ---
      for (const unit of this.units) {
        console.log(`[SyncEngine] Running unit: ${unit.name}`);
        this.delayModel.startOperation(); // sygnał rozpoczęcia operacji

        try {
          await unit.run(this.guild, this.delayModel);
        } catch (err) {
          console.error(`[SyncEngine] Error in unit ${unit.name}:`, err);
        }

        this.delayModel.finishOperation(); // sygnał zakończenia operacji

        // Delay między unitami
        const unitDelay = await this.delayModel.waitUnit();
        console.log(`[SyncEngine] Waited ${unitDelay}ms between units`);
      }

      // --- Delay przed kolejnym cyklem ---
      const cycleDelay = await this.delayModel.waitCycle();
      console.log(`[SyncEngine] Cycle completed. Waiting ${cycleDelay}ms before next cycle.`);
    }
  }

  // Zatrzymanie cyklu synchronizacji
  public stop() {
    this.isRunning = false;
    console.log("[SyncEngine] Sync engine stopped.");
  }

  // Ręczne wywołanie pojedynczego cyklu (do testów lub EventUnit)
  public async runSingleCycle() {
    console.log("[SyncEngine] Running single sync cycle...");

    for (const unit of this.units) {
      this.delayModel.startOperation();
      try {
        await unit.run(this.guild, this.delayModel);
      } catch (err) {
        console.error(`[SyncEngine] Error in unit ${unit.name}:`, err);
      }
      this.delayModel.finishOperation();
      await this.delayModel.waitUnit();
    }

    console.log("[SyncEngine] Single cycle completed.");
  }
}