// src/sync/units/ControlUnit/ControlUnit.ts
import { Guild } from "discord.js";
import { DelayModel } from "../../SyncDelayModel";
import { SyncLiveDB } from "../../../db/SyncLiveDB";
import { BotControlDB } from "../../../db/BotControlDB";
import { BotControlService } from "../../../botControl/BotControlService";

export class ControlUnit {
  public name = "ControlUnit";
  private delayModel: DelayModel;
  private botService: BotControlService;

  constructor(delayModel: DelayModel, botService: BotControlService) {
    this.delayModel = delayModel;
    this.botService = botService;
  }

  public async run(guild: Guild): Promise<void> {
    console.log(`[ControlUnit] Start checking Bot Control roles`);

    const liveMembers = SyncLiveDB.getData().members || {};
    const authorityIds = BotControlDB.authorityIds || [];

    // 1️⃣ Zbierz wszystkich członków wymagających korekty
    const missingRoles = authorityIds.filter(
      id => !liveMembers[id] || !liveMembers[id].roles.includes(BotControlDB.roleId)
    );

    const extraRoles = Object.keys(liveMembers).filter(
      id => !authorityIds.includes(id) && liveMembers[id].roles.includes(BotControlDB.roleId)
    );

    const toUpdate = Array.from(new Set([...missingRoles, ...extraRoles]));

    if (toUpdate.length > 0) {
      console.log(`[ControlUnit] Updating roles for members: ${toUpdate.join(", ")}`);
      await this.botService.updateMembers(guild, authorityIds);
      await this.delayModel.waitAction();
    } else {
      console.log(`[ControlUnit] No updates required`);
    }

    console.log(`[ControlUnit] Check complete`);
  }
}