// src/sync/units/ControlUnit/ControlUnit.ts
import { Guild } from "discord.js";
import { BotControlService } from "../../../botControl/BotControlService";
import { BotControlDB } from "../../../db/BotControlDB";
import { SyncLiveDB } from "../../../db/SyncLiveDB";
import { DelayModel } from "../../SyncDelayModel";

export class ControlUnit {
  public name = "ControlUnit";
  private botService: BotControlService;
  private delayModel: DelayModel;

  constructor(botService: BotControlService, delayModel: DelayModel) {
    this.botService = botService;
    this.delayModel = delayModel;
  }

  // Główna funkcja uruchamiana przez SyncEngine
  public async run(guild: Guild): Promise<void> {
    console.log(`[ControlUnit] Start checking Bot Control roles`);

    // Pobieramy aktualny live stan z SyncLiveDB
    const liveData = SyncLiveDB.getData(); // roleId, authorityIds
    const botData = BotControlDB.getData(); // baza source

    // --- 1️⃣ Sprawdzenie roli Bot Control ---
    if (!botData.roleId) {
      console.warn("[ControlUnit] Brak zdefiniowanej roli Bot Control w DB. Tworzymy ją...");
      // Role tworzy BotControlService, nie unit
    } else if (liveData.roleId !== botData.roleId) {
      console.log(`[ControlUnit] Live roleId różni się od DB, aktualizacja w SyncLiveDB`);
      liveData.roleId = botData.roleId; // aktualizacja liveDB
    }

    // --- 2️⃣ Sprawdzenie członków z uprawnieniami ---
    const authorityIds = botData.authorityIds || [];
    for (const id of authorityIds) {
      const memberHasRole = liveData.membersWithRole?.includes(id) || false;

      if (!memberHasRole) {
        console.log(`[ControlUnit] Członek ${id} nie ma roli Bot Control w liveDB`);
        // Sygnalizujemy serwisowi, aby przydzielił rolę
        await this.botService.updateMembers(guild, authorityIds);
        await this.delayModel.waitAction(); // dynamiczny delay między użytkownikami
      }
    }

    // --- 3️⃣ Usuwanie nieautoryzowanych członków ---
    const membersWithRole = liveData.membersWithRole || [];
    for (const id of membersWithRole) {
      if (!authorityIds.includes(id)) {
        console.log(`[ControlUnit] Członek ${id} posiada rolę Bot Control, ale nie jest w authorityIds`);
        await this.botService.updateMembers(guild, authorityIds);
        await this.delayModel.waitAction(); // dynamiczny delay
      }
    }

    console.log(`[ControlUnit] Check complete`);
  }
}