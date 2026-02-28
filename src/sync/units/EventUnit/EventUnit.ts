import { Guild, OverwriteResolvable } from "discord.js";
import { DelayModel } from "../../SyncDelayModel";
import { SyncLiveDB } from "../../../db/SyncLiveDB";
import { BotControlDB } from "../../../db/BotControlDB";
import { BotControlService } from "../../../botControl/BotControlService";
import { allianceDB } from "../../../alliance/AllianceDB";
import { AllianceService } from "../../../alliance/AllianceService";

export class EventUnit {
  public name = "EventUnit";
  private delayModel: DelayModel;
  private botService: BotControlService;

  constructor(delayModel: DelayModel, botService: BotControlService) {
    this.delayModel = delayModel;
    this.botService = botService;
  }

  public async handleEvent(guild: Guild, eventData: any) {
    this.delayModel.setFreeze(true);
    const liveDB = SyncLiveDB.getData();

    switch (eventData.type) {
      case "roleAdd":
        if (!liveDB.members[eventData.userId].roles.includes(eventData.roleId))
          liveDB.members[eventData.userId].roles.push(eventData.roleId);
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
    }

    if (eventData.roleId === BotControlDB.roleId) {
      await this.botService.updateMembers(guild, BotControlDB.authorityIds);
      await this.delayModel.waitAction();
    }

    const allianceTags = Object.keys(allianceDB.roles).map(r => r.slice(-3));
    for (const tag of allianceTags) {
      for (const [roleName, sourceRoleId] of Object.entries(allianceDB.roles)) {
        const liveRoleId = liveDB.roles?.[roleName];
        if (!liveRoleId || liveRoleId !== sourceRoleId) {
          await AllianceService.createAlliance(guild, roleName.split(" · ")[0], tag);
          await this.delayModel.waitAction();
        }
      }

      for (const [channelName, sourceChId] of Object.entries(allianceDB.channels)) {
        const liveChId = liveDB.channels?.[channelName];
        if (!liveChId || !guild.channels.cache.has(liveChId)) {
          await AllianceService.createAlliance(guild, channelName.split(" · ")[0], tag);
          await this.delayModel.waitAction();
        }
      }

      for (const [channelName, sourcePerms] of Object.entries(allianceDB.permissions || {})) {
        const livePerms = liveDB.permissions?.[channelName];
        if (!livePerms || JSON.stringify(livePerms) !== JSON.stringify(sourcePerms)) {
          const channel = guild.channels.cache.find(c => c.name === channelName);
          if (channel) await channel.permissionOverwrites.set(sourcePerms as OverwriteResolvable[]);
          liveDB.permissions[channelName] = sourcePerms;
          await this.delayModel.waitAction();
        }
      }
    }

    this.delayModel.setFreeze(false);
  }
}