// src/sync/units/ChannelUnit/ChannelUnit.ts
import { Guild, TextChannel, VoiceChannel, CategoryChannel } from "discord.js";
import { DelayModel } from "../../SyncDelayModel";
import { SyncLiveDB } from "../../../db/SyncLiveDB";
import { allianceDB } from "../../../db/AllianceDB";
import { AllianceService } from "../../../alliance/AllianceService";

export class ChannelUnit {
  public name = "ChannelUnit";
  private delayModel: DelayModel;

  constructor(delayModel: DelayModel) {
    this.delayModel = delayModel;
  }

  public async run(guild: Guild): Promise<void> {
    console.log(`[ChannelUnit] Start checking alliance channels`);

    const liveChannels = SyncLiveDB.getData().channels || {};
    const sourceChannels = allianceDB.channels;

    // 1️⃣ Sprawdzenie brakujących kanałów w liveDB
    for (const [chName, chId] of Object.entries(sourceChannels)) {
      const liveChId = liveChannels[chName];
      if (!liveChId || !guild.channels.cache.has(liveChId)) {
        console.log(`[ChannelUnit] Kanał "${chName}" brak w liveDB lub nie istnieje`);
        // Zgłaszamy do serwisu utworzenie sojuszu, który stworzy kanały
        await AllianceService.createAlliance(
          guild,
          chName.split(" · ")[0],
          chName.slice(-3)
        );
        await this.delayModel.waitAction();
      }
    }

    // 2️⃣ Sprawdzenie nieautoryzowanych kanałów w liveDB
    for (const [chName, liveChId] of Object.entries(liveChannels)) {
      if (!sourceChannels[chName]) {
        console.log(`[ChannelUnit] Kanał "${chName}" istnieje w liveDB, ale nie ma go w sourceDB`);
        // Zgłaszamy do serwisu usunięcie
        await AllianceService.deleteAlliance(
          guild,
          chName.split(" · ")[0],
          chName.slice(-3)
        );
        await this.delayModel.waitAction();
      }
    }

    console.log(`[ChannelUnit] Check complete`);
  }
}