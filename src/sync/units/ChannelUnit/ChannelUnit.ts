import { Guild } from "discord.js";
import { syncLiveDB } from "../../../db/SyncLiveDB";
import { allianceDB } from "../../../db/AllianceDB";
import { DelayModel } from "../../SyncDelayModel";
import { ChannelModule } from "../../../modules/ChannelModule";

export class ChannelUnit {
  private delayModel: DelayModel;
  public name = "ChannelUnit";

  constructor(delayModel: DelayModel) {
    this.delayModel = delayModel;
  }

  public async run(guild: Guild) {
    console.log(`[ChannelUnit] Checking channels...`);

    const liveChannels = syncLiveDB.channels;
    const sourceChannels = allianceDB.channels;

    for (const [chName, chId] of Object.entries(sourceChannels)) {
      if (!Object.values(liveChannels).includes(chId)) {
        console.log(`[ChannelUnit] Missing channel: ${chName}, should create via ChannelModule`);
      }
      await this.delayModel.waitAction();
    }
  }
}
