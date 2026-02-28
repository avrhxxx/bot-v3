// src/sync/units/EventUnit/EventUnit.ts
import { Guild, OverwriteResolvable, PermissionFlagsBits } from "discord.js";
import { DelayModel } from "../../SyncDelayModel";
import { SyncLiveDB } from "../../../db/SyncLiveDB";
import { BotControlDB } from "../../../db/BotControlDB";
import { BotControlService } from "../../../botControl/BotControlService";
import { allianceDB } from "../../../db/AllianceDB";
import { AllianceService } from "../../../alliance/AllianceService";

export class EventUnit {
  public name = "EventUnit";
  private delayModel: DelayModel;
  private botService: BotControlService;

  constructor(delayModel: DelayModel, botService: BotControlService) {
    this.delayModel = delayModel;
    this.botService = botService;
  }

  // eventData przykładowo: 
  // { type: 'roleAdd'|'roleRemove'|'channelCreate'|'channelDelete'|'permissionChange', userId?, roleId?, channelName?, newPermissions? }
  public async handleEvent(guild: Guild, eventData: any) {
    console.log(`[EventUnit] Handling event:`, eventData);

    // 1️⃣ Freeze synchronizacji cyklicznej
    this.delayModel.setFreeze(true);

    // 2️⃣ Aktualizacja liveDB
    const liveDB = SyncLiveDB.getData();

    switch (eventData.type) {
      case "roleAdd":
        if (!liveDB.members[eventData.userId].roles.includes(eventData.roleId)) {
          liveDB.members[eventData.userId].roles.push(eventData.roleId);
        }
        break;

      case "roleRemove":
        liveDB.members[eventData.userId].roles =
          liveDB.members[eventData.userId].roles.filter(r => r !== eventData.roleId);
        break;

      case "channelCreate":
        liveDB.channels[eventData.channelName] = eventData.channelId;
        break;

      case "channelDelete":
        delete liveDB.channels[eventData.channelName];
        break;

      case "permissionChange":
        liveDB.permissions = liveDB.permissions || {};
        liveDB.permissions[eventData.channelName] = eventData.newPermissions;
        break;

      default:
        console.log(`[EventUnit] Unknown event type: ${eventData.type}`);
    }

    // 3️⃣ Korekta Bot Control (role)
    if (eventData.roleId === BotControlDB.roleId) {
      await this.botService.updateMembers(guild, BotControlDB.authorityIds);
      await this.delayModel.waitAction();
    }

    // 4️⃣ Korekta sojuszy (role/kanały/permissions)
    const allianceTags = Object.keys(allianceDB.roles).map(r => r.slice(-3));
    for (const tag of allianceTags) {
      // 4a️⃣ Sprawdzenie ról sojuszy
      for (const [roleName, sourceRoleId] of Object.entries(allianceDB.roles)) {
        const liveRoleId = liveDB.roles?.[roleName];
        if (!liveRoleId || liveRoleId !== sourceRoleId) {
          console.log(`[EventUnit] Rola "${roleName}" niezgodna z sourceDB`);
          await AllianceService.createAlliance(guild, roleName.split(" · ")[0], tag);
          await this.delayModel.waitAction();
        }
      }

      // 4b️⃣ Sprawdzenie kanałów sojuszy
      for (const [channelName, sourceChId] of Object.entries(allianceDB.channels)) {
        const liveChId = liveDB.channels?.[channelName];
        if (!liveChId || !guild.channels.cache.has(liveChId)) {
          console.log(`[EventUnit] Kanał "${channelName}" nie istnieje w liveDB`);
          await AllianceService.createAlliance(guild, channelName.split(" · ")[0], tag);
          await this.delayModel.waitAction();
        }
      }

      // 4c️⃣ Sprawdzenie permissions
      for (const [channelName, sourcePerms] of Object.entries(allianceDB.permissions || {})) {
        const livePerms = liveDB.permissions?.[channelName];
        if (!livePerms || JSON.stringify(livePerms) !== JSON.stringify(sourcePerms)) {
          console.log(`[EventUnit] Permissions w kanale "${channelName}" niezgodne`);
          const channel = guild.channels.cache.find(c => c.name === channelName);
          if (channel) {
            await channel.permissionOverwrites.set(sourcePerms as OverwriteResolvable[]);
          }
          liveDB.permissions[channelName] = sourcePerms;
          await this.delayModel.waitAction();
        }
      }
    }

    // 5️⃣ Odblokowanie synchronizacji cyklicznej
    this.delayModel.setFreeze(false);
    console.log(`[EventUnit] Event handling complete`);
  }
}