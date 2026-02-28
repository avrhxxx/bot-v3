// src/sync/units/PermsUnit/PermsUnit.ts
import { Guild, PermissionFlagsBits, OverwriteResolvable } from "discord.js";
import { DelayModel } from "../../SyncDelayModel";
import { SyncLiveDB } from "../../../db/SyncLiveDB";
import { allianceDB } from "../../../db/AllianceDB";
import { BotControlDB } from "../../../db/BotControlDB";
import { AllianceService } from "../../../alliance/AllianceService";
import { BotControlService } from "../../../botControl/BotControlService";

export class PermsUnit {
  public name = "PermsUnit";
  private delayModel: DelayModel;
  private botService: BotControlService;

  constructor(delayModel: DelayModel, botService: BotControlService) {
    this.delayModel = delayModel;
    this.botService = botService;
  }

  public async run(guild: Guild): Promise<void> {
    console.log(`[PermsUnit] Start checking channel permissions`);

    const liveChannels = SyncLiveDB.getData().channels || {};
    const sourceChannels = allianceDB.channels;
    const systemChannels = Object.entries(BotControlDB.channels);

    // --- 1️⃣ Sprawdzenie permissionów kanałów sojuszniczych ---
    for (const [chName, chId] of Object.entries(sourceChannels)) {
      const channel = guild.channels.cache.get(chId);
      if (!channel) continue;

      const currentOverwrites = channel.permissionOverwrites.cache;
      const expectedOverwrites: OverwriteResolvable[] = [];

      // Everyone i role sojusznicze (przykładowe)
      expectedOverwrites.push({
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel],
      });

      ["R3", "R4", "R5"].forEach(r => {
        const roleId = allianceDB.roles[`${r}[${chName.slice(-3)}]`];
        if (roleId) expectedOverwrites.push({ id: roleId, allow: [PermissionFlagsBits.ViewChannel] });
      });

      // Porównanie i korekta
      for (const ow of expectedOverwrites) {
        const current = currentOverwrites.get(ow.id);
        if (!current || !current.allow.has(PermissionFlagsBits.ViewChannel)) {
          console.log(`[PermsUnit] Correcting permissions in channel ${chName} for ${ow.id}`);
          await channel.permissionOverwrites.edit(ow.id, ow as any);
          await this.delayModel.waitAction();
        }
      }
    }

    // --- 2️⃣ Sprawdzenie permissionów kanałów systemowych ---
    for (const [chName, chId] of systemChannels) {
      const channel = guild.channels.cache.get(chId);
      if (!channel) continue;

      const currentOverwrites = channel.permissionOverwrites.cache;
      const expectedOverwrites: OverwriteResolvable[] = [];

      expectedOverwrites.push({
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel],
      });
      expectedOverwrites.push({
        id: BotControlDB.roleId,
        allow: [PermissionFlagsBits.ViewChannel],
      });

      // Porównanie i korekta
      for (const ow of expectedOverwrites) {
        const current = currentOverwrites.get(ow.id);
        const needUpdate =
          !current ||
          (ow.allow && !Array.from(ow.allow).every(p => current.allow.has(p))) ||
          (ow.deny && !Array.from(ow.deny).every(p => current.deny.has(p)));
        if (needUpdate) {
          console.log(`[PermsUnit] Correcting system permissions in channel ${chName}`);
          await channel.permissionOverwrites.edit(ow.id, ow as any);
          await this.delayModel.waitAction();
        }
      }
    }

    console.log(`[PermsUnit] Permission check complete`);
  }
}