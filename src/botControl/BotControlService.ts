import { Guild, OverwriteResolvable, PermissionFlagsBits } from "discord.js";
import { BotControlModule } from "../modules/BotControlModule";
import { BotControlDB } from "../db/BotControlDB";
import { SyncNotify } from "../sync/SyncNotify";

export class BotControlService {
  private module: BotControlModule;

  constructor() {
    this.module = new BotControlModule();
  }

  public async init(guild: Guild) {
    const db = BotControlDB.getData();

    if (!db.roleId) {
      const role = await this.module.createRole(guild, "Bot Control", 0x800080);
      BotControlDB.roleId = role.id;
    }

    for (const chName of ["synchronization", "bot-commands", "alliance-logs"]) {
      if (!db.channels[chName]) {
        const channel = await this.module.createTextChannel(guild, chName, [
          { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: BotControlDB.roleId, allow: [PermissionFlagsBits.ViewChannel] }
        ]);
        BotControlDB.channels[chName] = channel.id;
      }
    }

    await SyncNotify.sendBotControlStatus(guild, BotControlDB);
  }

  public async updateMembers(guild: Guild, authorityIds: string[]) {
    const added: string[] = [];
    const removed: string[] = [];

    for (const id of authorityIds) {
      const member = await guild.members.fetch(id).catch(() => null);
      if (member && !member.roles.cache.has(BotControlDB.roleId)) {
        await this.module.assignRole(member, BotControlDB.roleId);
        added.push(id);
      }
    }

    const membersWithRole = await guild.members.fetch();
    for (const [id, member] of membersWithRole) {
      if (!authorityIds.includes(id) && member.roles.cache.has(BotControlDB.roleId)) {
        await this.module.removeRole(member, BotControlDB.roleId);
        removed.push(id);
      }
    }

    BotControlDB.authorityIds = authorityIds;
    await SyncNotify.sendBotControlUpdate(guild, authorityIds, added.concat(removed));
  }

  public async updateChannelPermissions(guild: Guild, channelName: string, newPermissions: OverwriteResolvable[]) {
    const channelId = BotControlDB.channels[channelName];
    if (!channelId) return;
    const channel = guild.channels.cache.get(channelId);
    if (!channel) return;

    await channel.permissionOverwrites.set(newPermissions);
    BotControlDB.permissions = BotControlDB.permissions || {};
    BotControlDB.permissions[channelName] = newPermissions;

    await SyncNotify.sendChannelPermissionUpdate(guild, channelName, newPermissions);
  }
}