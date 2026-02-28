// src/sync/units/PermsUnit/PermsUnit.ts
import { Guild, PermissionFlagsBits } from "discord.js";
import { DelayModel } from "../../SyncDelayModel";
import { SyncLiveDB } from "../../../db/SyncLiveDB";
import { allianceDB, AllianceService } from "../../../alliance/AllianceService";
import { BotControlDB, BotControlService } from "../../../alliance/AllianceService";

export class PermsUnit {
  public name = "PermsUnit";
  private delayModel: DelayModel;
  private botService: BotControlService;

  constructor(delayModel: DelayModel, botService: BotControlService) {
    this.delayModel = delayModel;
    this.botService = botService;
  }

  public async run(guild: Guild): Promise<void> {
    console.log(`[PermsUnit] Start checking permissions`);

    const liveDB = SyncLiveDB.getData();

    // --- 1️⃣ Kanały sojuszy ---
    for (const [channelName, channelId] of Object.entries(allianceDB.channels)) {
      const liveChannel = guild.channels.cache.get(channelId);
      if (!liveChannel) continue;

      const sourceOverwrites = this.buildExpectedOverwrites(channelName, allianceDB, guild);
      const liveOverwrites = liveChannel.permissionOverwrites.cache;

      // Sprawdzenie niezgodności
      for (const [id, perms] of Object.entries(sourceOverwrites)) {
        const livePerm = liveOverwrites.get(id);
        if (!livePerm || !this.comparePermissions(perms, livePerm)) {
          console.log(`[PermsUnit] Kanał sojuszu "${channelName}" ma nieprawidłowe permisje dla ${id}`);
          // Zgłoszenie do serwisu Alliance
          await AllianceService.createAlliance(guild, channelName.split(" · ")[0], channelName.slice(-3));
          await this.delayModel.waitAction();
        }
      }
    }

    // --- 2️⃣ Kanały systemowe ---
    for (const [chName, chId] of Object.entries(BotControlDB.getChannels())) {
      const liveChannel = guild.channels.cache.get(chId);
      if (!liveChannel) continue;

      const expectedOverwrites = this.buildSystemOverwrites(BotControlDB, guild);
      const liveOverwrites = liveChannel.permissionOverwrites.cache;

      for (const [id, perms] of Object.entries(expectedOverwrites)) {
        const livePerm = liveOverwrites.get(id);
        if (!livePerm || !this.comparePermissions(perms, livePerm)) {
          console.log(`[PermsUnit] Kanał systemowy "${chName}" ma nieprawidłowe permisje dla ${id}`);
          // Zgłoszenie do serwisu BotControl
          await this.botService.init(guild); // naprawa perms
          await this.delayModel.waitAction();
        }
      }
    }

    console.log(`[PermsUnit] Permissions check complete`);
  }

  // --- pomocnicze ---
  private buildExpectedOverwrites(channelName: string, db: typeof allianceDB, guild: Guild) {
    const overwrites: Record<string, { allow?: number; deny?: number }> = {};

    // everyone
    overwrites[guild.roles.everyone.id] = { deny: PermissionFlagsBits.ViewChannel };

    // role sojuszy
    ["R3","R4","R5"].forEach(r => {
      const roleId = db.roles[`${r}[${channelName.slice(-3)}]`];
      if (roleId) overwrites[roleId] = { allow: PermissionFlagsBits.ViewChannel };
    });

    return overwrites;
  }

  private buildSystemOverwrites(botDb: typeof BotControlDB, guild: Guild) {
    const overwrites: Record<string, { allow?: number; deny?: number }> = {};

    // everyone
    overwrites[guild.roles.everyone.id] = { deny: PermissionFlagsBits.ViewChannel };

    // BotControl role
    const controlRoleId = botDb.getControlRole();
    if (controlRoleId) overwrites[controlRoleId] = { allow: PermissionFlagsBits.ViewChannel };

    return overwrites;
  }

  private comparePermissions(expected: { allow?: number; deny?: number }, live: any) {
    const allowMatch = (expected.allow ?? 0) === (live.allow.bitfield ?? 0);
    const denyMatch = (expected.deny ?? 0) === (live.deny.bitfield ?? 0);
    return allowMatch && denyMatch;
  }
}