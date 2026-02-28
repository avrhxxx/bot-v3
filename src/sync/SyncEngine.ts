// src/sync/SyncEngine.ts
import { DelayModel } from "./DelayModel";
import { Guild } from "discord.js";

// Typ jednostki
export interface Unit {
  name: string;
  run: (guild: Guild) => Promise<void>;
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

    while (this.isRunning) {
      console.log(`[SyncEngine] Starting new sync cycle...`);

      // 1️⃣ Kolejno uruchamiane unit-y
      for (const unit of this.units) {
        console.log(`[SyncEngine] Running unit: ${unit.name}`);
        this.delayModel.startOperation();   // sygnał, że unit startuje

        try {
          await unit.run(this.guild);
        } catch (e) {
          console.error(`[SyncEngine] Error in unit ${unit.name}:`, e);
        }

        this.delayModel.finishOperation();  // sygnał, że unit zakończył
        const unitDelay = await this.delayModel.waitUnit();
        console.log(`[SyncEngine] Waited ${unitDelay}ms between units`);
      }

      // 2️⃣ Delay przed kolejnym cyklem
      const cycleDelay = await this.delayModel.waitCycle();
      console.log(`[SyncEngine] Cycle completed. Waiting ${cycleDelay}ms before next cycle.`);
    }
  }

  // Zatrzymanie cyklu synchronizacji
  public stop() {
    this.isRunning = false;
  }
}