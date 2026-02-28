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

    // 1️⃣ Przydział brakujących ról
    for (const id of authorityIds) {
      if (!liveMembers[id] || !liveMembers[id].roles.includes(BotControlDB.roleId)) {
        console.log(`[ControlUnit] User ${id} nie ma roli Bot Control, zgłaszam do serwisu`);
        await this.botService.updateMembers(guild, authorityIds);
        await this.delayModel.waitAction();
      }
    }

    // 2️⃣ Usunięcie roli z osób, które nie są już authority
    for (const [id, member] of Object.entries(liveMembers)) {
      if (!authorityIds.includes(id) && member.roles.includes(BotControlDB.roleId)) {
        console.log(`[ControlUnit] User ${id} nie jest authority, zgłaszam do serwisu`);
        await this.botService.updateMembers(guild, authorityIds);
        await this.delayModel.waitAction();
      }
    }

    console.log(`[ControlUnit] Check complete`);
  }
}