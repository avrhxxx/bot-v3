import { Guild } from "discord.js";
import { syncLiveDB } from "../../../db/SyncLiveDB";
import { allianceDB } from "../../../db/AllianceDB";
import { DelayModel } from "../../SyncDelayModel";

export class EventUnit {
  private delayModel: DelayModel;
  public name = "EventUnit";

  constructor(delayModel: DelayModel) {
    this.delayModel = delayModel;
  }

  public async run(guild: Guild) {
    // działa w czasie rzeczywistym, nie czeka na cykl
    console.log(`[EventUnit] Listening to events...`);

    // może tymczasowo zamrozić synchronizację
    // delay model będzie uwzględniał freeze
    await this.delayModel.waitAction();
  }
}
