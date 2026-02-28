import { Guild } from "discord.js";
import { BotControlDB } from "../../../db/BotControlDB";
import { syncLiveDB } from "../../../db/SyncLiveDB";
import { DelayModel } from "../../SyncDelayModel";
import { BotControlService } from "../../../botControl/BotControlService";

export class ControlUnit {
  private service: BotControlService;
  private delayModel: DelayModel;
  public name = "ControlUnit";

  constructor(service: BotControlService, delayModel: DelayModel) {
    this.service = service;
    this.delayModel = delayModel;
  }

  public async run(guild: Guild) {
    console.log(`[ControlUnit] Checking Bot Control roles...`);

    const liveAuthorities = syncLiveDB.botControl.authorityIds;
    const sourceAuthorities = BotControlDB.authorityIds;

    // porównanie
    const toAdd = sourceAuthorities.filter(id => !liveAuthorities.includes(id));
    const toRemove = liveAuthorities.filter(id => !sourceAuthorities.includes(id));

    // aktualizacja przez serwis
    if (toAdd.length > 0 || toRemove.length > 0) {
      await this.service.updateMembers(guild, sourceAuthorities);
      console.log(`[ControlUnit] Bot Control updated`);
    }

    await this.delayModel.waitAction();
  }
}