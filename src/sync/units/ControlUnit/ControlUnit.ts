// src/sync/units/ControlUnit/ControlUnit.ts
import { Guild } from "discord.js";
import { DelayModel } from "../../SyncDelayModel";
import { BotControlDB } from "../../../db/BotControlDB";
import { BotControlService } from "../../../botControl/BotControlService";

export class ControlUnit {
  private delayModel: DelayModel;
  private botService: BotControlService;

  constructor(delayModel: DelayModel, botService: BotControlService) {
    this.delayModel = delayModel;
    this.botService = botService;
  }

  public name = "ControlUnit";

  public async run(guild: Guild) {
    this.delayModel.startOperation();

    // 1️⃣ Sprawdzenie authority IDs w sourceDB vs liveDB
    const authorityIds = BotControlDB.authorityIds || [];
    await this.botService.updateMembers(guild, authorityIds);

    // 2️⃣ Odczekanie dynamiczne po każdej akcji
    await this.delayModel.waitAction();

    this.delayModel.finishOperation();
  }
}