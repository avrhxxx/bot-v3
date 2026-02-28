// src/sync/units/ChannelUnit/ChannelUnit.ts
import { Guild, TextChannel, VoiceChannel, CategoryChannel } from "discord.js";
import { DelayModel } from "../../SyncDelayModel";
import { SyncLiveDB } from "../../../db/SyncLiveDB";
import { allianceDB } from "../../../db/AllianceDB";
import { AllianceService } from "../../../alliance/AllianceService";
import { BotControlDB } from "../../../db/BotControlDB";
import { BotControlService } from "../../../botControl/BotControlService";

export class ChannelUnit {
  public name = "ChannelUnit";
  private delayModel: DelayModel;
  private botService: BotControlService;

  constructor(delayModel: DelayModel, botService: BotControlService) {
    this.delayModel = delayModel;
    this.botService = botService;
  }

  public async run(guild: Guild): Promise<void> {
    console.log(`[ChannelUnit] Start checking channels`);

    const liveChannels = SyncLiveDB.getData().channels || {};
    const sourceChannels = allianceDB.channels;

    // --- 1️⃣ Sprawdzenie brakujących kanałów sojuszniczych ---
    for (const [chName, chId] of Object.entries(sourceChannels)) {
      const liveChId = liveChannels[chName];
      if (!liveChId || !guild.channels.cache.has(liveChId)) {
        console.log(`[ChannelUnit] Kanał sojuszniczy "${chName}" brak w liveDB lub nie istnieje`);
        await AllianceService.createAlliance(
          guild,
          chName.split(" · ")[0],
          chName.slice(-3)
        );
        await this.delayModel.waitAction();
      }
    }

    // --- 2️⃣ Sprawdzenie nieautoryzowanych kanałów sojuszniczych ---
    for (const [chName, liveChId] of Object.entries(liveChannels)) {
      if (sourceChannels[chName]) continue; // pomijamy legalne kanały
      if (chName.includes("👋") || chName.includes("📢") || chName.includes("💬") || chName.includes("🛡") || chName.includes("✋")) {
        console.log(`[ChannelUnit] Kanał sojuszniczy "${chName}" istnieje w liveDB, ale nie ma go w sourceDB`);
        await AllianceService.deleteAlliance(
          guild,
          chName.split(" · ")[0],
          chName.slice(-3)
        );
        await this.delayModel.waitAction();
      }
    }

    // --- 3️⃣ Sprawdzenie brakujących kanałów systemowych ---
    const systemChannels = ["synchronization", "bot-commands", "alliance-logs"];
    for (const chName of systemChannels) {
      const liveCh = Object.entries(liveChannels).find(([name]) => name === chName);
      const dbChId = BotControlDB.channels[chName];
      if (!liveCh || !guild.channels.cache.has(dbChId)) {
        console.log(`[ChannelUnit] Kanał systemowy "${chName}" brak w liveDB lub nie istnieje`);
        await this.botService.init(guild); // init tworzy brakujące kanały systemowe
        await this.delayModel.waitAction();
      }
    }

    console.log(`[ChannelUnit] Channel check complete`);
  }
}