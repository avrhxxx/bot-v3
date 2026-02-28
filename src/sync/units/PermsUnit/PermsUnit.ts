import { Guild } from "discord.js";
import { syncLiveDB } from "../../../db/SyncLiveDB";
import { allianceDB } from "../../../db/AllianceDB";
import { DelayModel } from "../../SyncDelayModel";

export class PermsUnit {
  private delayModel: DelayModel;
  public name = "PermsUnit";

  constructor(delayModel: DelayModel) {
    this.delayModel = delayModel;
  }

  public async run(guild: Guild) {
    console.log(`[PermsUnit] Checking permissions...`);

    const livePerms = syncLiveDB.permissions;
    const sourcePerms = allianceDB.permissions;

    // porównanie live vs source
    // przekazanie do serwisu lub modułu odpowiedzialnego za poprawę
    await this.delayModel.waitAction();
  }
}
