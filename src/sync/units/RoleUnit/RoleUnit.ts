// src/sync/units/PermsUnit/PermsUnit.ts
import { Guild, PermissionFlagsBits, TextChannel, VoiceChannel } from "discord.js";
import { DelayModel } from "../../SyncDelayModel";
import { SyncLiveDB } from "../../../db/SyncLiveDB";
import { allianceDB } from "../../../db/AllianceDB";
import { BotControlDB } from "../../../db/BotControlDB";
import { AllianceService } from "../../../alliance/AllianceService";
import { BotControlService } from "../../../botControl/BotControlService";

export class PermsUnit {
  public name = "PermsUnit";
  private delayModel: DelayModel;
  private botControlService: BotControlService;

  constructor(delayModel: DelayModel, botControlService: BotControlService) {
    this.delayModel = delayModel;
    this.botControlService = botControlService;
  }

  public async run(guild: Guild): Promise<void> {
    console.log(`[PermsUnit] Start checking channel permissions`);

    const liveData = SyncLiveDB.getData();

    // --- 1️⃣ Kanały sojuszy ---
    for (const [channelName, channelId] of Object.entries(allianceDB.channels)) {
      const channel = guild.channels.cache.get(channelId) as TextChannel | VoiceChannel;
      if (!channel) continue;

      const sourceOverwrites = channel.permissionOverwrites.cache;
      const liveOverwrites = channel.permissionOverwrites.cache;

      let mismatchFound = false;

      sourceOverwrites.forEach((sourcePerms, id) => {
        const livePerms = liveOverwrites.get(id);
        if (!livePerms || livePerms.allow.bitfield !== sourcePerms.allow.bitfield || livePerms.deny.bitfield !== sourcePerms.deny.bitfield) {
          mismatchFound = true;
        }
      });

      if (mismatchFound) {
        console.log(`[PermsUnit] Permissions mismatch in channel "${channelName}"`);
        // Zgłaszamy do serwisu sojuszu korektę
        // Tu używamy delete+create jako prosty mechanizm, serwis może rozwinąć bardziej precyzyjny update
        const allianceName = channelName.split(" · ")[0];
        const tag = channelName.slice(-3);
        await AllianceService.deleteAlliance(guild, allianceName, tag);
        await AllianceService.createAlliance(guild, allianceName, tag);

        await this.delayModel.waitAction();
      }
    }

    // --- 2️⃣ Kanały systemowe (Bot Control) ---
    for (const [channelName, channelId] of Object.entries(BotControlDB.channels)) {
      const channel = guild.channels.cache.get(channelId) as TextChannel | undefined;
      if (!channel) continue;

      const sourceOverwrites = channel.permissionOverwrites.cache;
      const liveOverwrites = channel.permissionOverwrites.cache;

      let mismatchFound = false;

      sourceOverwrites.forEach((sourcePerms, id) => {
        const livePerms = liveOverwrites.get(id);
        if (!livePerms || livePerms.allow.bitfield !== sourcePerms.allow.bitfield || livePerms.deny.bitfield !== sourcePerms.deny.bitfield) {
          mismatchFound = true;
        }
      });

      if (mismatchFound) {
        console.log(`[PermsUnit] Permissions mismatch in system channel "${channelName}"`);
        // Zgłaszamy do serwisu Bot Control
        await this.botControlService.init(guild); // inicjalizacja korekty uprawnień
        await this.delayModel.waitAction();
      }
    }

    console.log(`[PermsUnit] Permission check complete`);
  }
}