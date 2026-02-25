/**
 * ============================================
 * MODULE: ChannelModule
 * FILE: src/system/alliance/channel/ChannelModule.ts
 * LAYER: SYSTEM (Alliance Channel Management Module)
 * ============================================
 *
 * RESPONSIBILITIES:
 * - Creating and managing alliance channels on Discord
 * - Setting visibility for R5/R4/R3 and public
 * - Keeping consistency with alliance category
 *
 * DEPENDENCIES:
 * - AllianceService (fetch alliance and roles)
 * - RoleModule (role consistency)
 *
 * ============================================
 */

import { Guild, TextChannel, CategoryChannel, ChannelType, PermissionFlagsBits } from "discord.js";
import { AllianceService } from "../AllianceService";
import { RoleModule } from "../role/RoleModule";

export class ChannelModule {
  private static channels: Record<string, Record<string, string>> = {};

  static async createChannels(guild: Guild, allianceId: string, tag: string, name: string) {
    const alliance = AllianceService.getAllianceOrThrow(allianceId);
    const roles = alliance.roles;

    const createdChannels: Record<string, TextChannel> = {};

    const category = await guild.channels.create({ name, type: ChannelType.GuildCategory }) as CategoryChannel;

    const welcome = await guild.channels.create({ name: "welcome", type: ChannelType.GuildText, parent: category.id }) as TextChannel;
    const announce = await guild.channels.create({ name: "announce", type: ChannelType.GuildText, parent: category.id }) as TextChannel;
    const chat = await guild.channels.create({ name: "chat", type: ChannelType.GuildText, parent: category.id }) as TextChannel;
    const staff = await guild.channels.create({ name: "staff-room", type: ChannelType.GuildText, parent: category.id }) as TextChannel;
    const join = await guild.channels.create({ name: "join", type: ChannelType.GuildText, parent: category.id }) as TextChannel;

    createdChannels["welcome"] = welcome;
    createdChannels["announce"] = announce;
    createdChannels["chat"] = chat;
    createdChannels["staff"] = staff;
    createdChannels["join"] = join;

    const everyoneId = guild.roles.everyone.id;

    await welcome.permissionOverwrites.set([{ id: everyoneId, deny: [PermissionFlagsBits.ViewChannel] }]);
    await announce.permissionOverwrites.set([
      { id: everyoneId, deny: [PermissionFlagsBits.ViewChannel] },
      { id: roles.r5RoleId, allow: [PermissionFlagsBits.ViewChannel] },
      { id: roles.r4RoleId, allow: [PermissionFlagsBits.ViewChannel] },
    ]);
    await chat.permissionOverwrites.set([
      { id: everyoneId, deny: [PermissionFlagsBits.ViewChannel] },
      { id: roles.r3RoleId, allow: [PermissionFlagsBits.ViewChannel] },
      { id: roles.r4RoleId, allow: [PermissionFlagsBits.ViewChannel] },
      { id: roles.r5RoleId, allow: [PermissionFlagsBits.ViewChannel] },
    ]);
    await staff.permissionOverwrites.set([
      { id: everyoneId, deny: [PermissionFlagsBits.ViewChannel] },
      { id: roles.r4RoleId, allow: [PermissionFlagsBits.ViewChannel] },
      { id: roles.r5RoleId, allow: [PermissionFlagsBits.ViewChannel] },
    ]);
    await join.permissionOverwrites.set([{ id: everyoneId, allow: [PermissionFlagsBits.ViewChannel] }]);

    this.channels[allianceId] = {
      categoryId: category.id,
      welcomeId: welcome.id,
      announceId: announce.id,
      chatId: chat.id,
      staffId: staff.id,
      joinId: join.id,
    };

    return this.channels[allianceId];
  }

  static getChannel(allianceId: string, type: keyof typeof ChannelModule["channels"][string]): string | undefined {
    return this.channels[allianceId]?.[type];
  }

  static getAnnounceChannel(allianceId: string) { return this.channels[allianceId]?.announceId; }
  static getWelcomeChannel(allianceId: string) { return this.channels[allianceId]?.welcomeId; }
  static getChatChannel(allianceId: string) { return this.channels[allianceId]?.chatId; }
  static getStaffChannel(allianceId: string) { return this.channels[allianceId]?.staffId; }
  static getJoinChannel(allianceId: string) { return this.channels[allianceId]?.joinId; }
}
