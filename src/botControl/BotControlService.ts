import { Guild, OverwriteResolvable, PermissionFlagsBits } from "discord.js";
import { BotControlModule } from "../modules/BotControlModule";
import { BotControlDB } from "../db/BotControlDB";
import { EmbedBuilder } from "../EmbedBuilder";

export class BotControlService {
  private module: BotControlModule;

  constructor() {
    this.module = new BotControlModule();
  }

  // Initialize Bot Control system
  public async init(guild: Guild) {
    const db = BotControlDB.getData();

    // 1️⃣ Create Bot Control role if missing
    if (!db.roleId) {
      const role = await this.module.createRole(guild, "Bot Control", 0x800080);
      BotControlDB.roleId = role.id;
    }

    // 2️⃣ Create system channels if missing
    for (const chName of ["synchronization", "bot-commands", "alliance-logs"]) {
      if (!db.channels[chName]) {
        const channel = await this.module.createTextChannel(guild, chName, [
          { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: BotControlDB.roleId, allow: [PermissionFlagsBits.ViewChannel] }
        ]);
        BotControlDB.channels[chName] = channel.id;
      }
    }

    // 3️⃣ Send status embed
    await EmbedBuilder.sendBotControlStatus(guild, BotControlDB);
  }

  // Update member roles
  public async updateMembers(guild: Guild, authorityIds: string[]) {
    for (const id of authorityIds) {
      const member = await guild.members.fetch(id).catch(() => null);
      if (member && !member.roles.cache.has(BotControlDB.roleId)) {
        await this.module.assignRole(member, BotControlDB.roleId);
      }
    }

    // Remove role from non-authorities
    const membersWithRole = await guild.members.fetch();
    for (const [id, member] of membersWithRole) {
      if (!authorityIds.includes(id) && member.roles.cache.has(BotControlDB.roleId)) {
        await this.module.removeRole(member, BotControlDB.roleId);
      }
    }

    // Update DB
    BotControlDB.authorityIds = authorityIds;
  }

  // Update system channel permissions
  public async updateChannelPermissions(guild: Guild, channelName: string, newPermissions: OverwriteResolvable[]) {
    const channelId = BotControlDB.channels[channelName];
    if (!channelId) {
      console.warn(`[BotControlService] System channel "${channelName}" missing in DB`);
      return;
    }
    const channel = guild.channels.cache.get(channelId);
    if (!channel) {
      console.warn(`[BotControlService] System channel "${channelName}" does not exist in guild`);
      return;
    }
    await channel.permissionOverwrites.set(newPermissions);
    console.log(`[BotControlService] Permissions updated for system channel "${channelName}"`);

    BotControlDB.permissions = BotControlDB.permissions || {};
    BotControlDB.permissions[channelName] = newPermissions;
  }
}