/**
 * ============================================
 * MODULE: ChannelModule
 * FILE: src/system/alliance/modules/channel/ChannelModule.ts
 * LAYER: SYSTEM (Alliance Channel Management Module)
 * ============================================
 *
 * RESPONSIBILITIES:
 * - Creating and managing alliance channels on Discord
 * - Setting visibility for R5/R4/R3, public, and non-members
 * - Keeping consistency with alliance category
 * - Dynamic category name with member count
 * - Adding voice channels with icons and permissions
 *
 * DEPENDENCIES:
 * - AllianceService (fetch alliance and roles)
 * - RoleModule (role consistency)
 *
 * NOTES:
 * - All methods are static for global access
 * - Channels are cached in-memory for faster updates
 *
 * ============================================
 */

import { Guild, TextChannel, CategoryChannel, VoiceChannel, ChannelType, PermissionFlagsBits } from "discord.js";
import { AllianceService } from "../AllianceService";
import { RoleModule } from "../role/RoleModule";

export class ChannelModule {
  // ----------------- IN-MEMORY CACHE -----------------
  private static channels: Record<string, Record<string, string>> = {};

  /**
   * Tworzy kanały i kategorię sojuszu
   */
  static async createChannels(guild: Guild, allianceId: string, tag: string, name: string) {
    const alliance = AllianceService.getAllianceOrThrow(allianceId);
    const roles = alliance.roles;

    const createdChannels: Record<string, TextChannel | VoiceChannel> = {};

    // ----------------- Tworzenie kategorii -----------------
    const memberCount = this.calculateMemberCount(allianceId);
    const categoryName = `🏰 ${tag} | ${name} | ${memberCount}/100`;
    const category = await guild.channels.create({
      name: categoryName,
      type: ChannelType.GuildCategory
    }) as CategoryChannel;

    // ----------------- Tworzenie kanałów tekstowych -----------------
    const welcome = await guild.channels.create({ name: "👋 welcome", type: ChannelType.GuildText, parent: category.id }) as TextChannel;
    const announce = await guild.channels.create({ name: "📢 announce", type: ChannelType.GuildText, parent: category.id }) as TextChannel;
    const chat = await guild.channels.create({ name: "💬 chat", type: ChannelType.GuildText, parent: category.id }) as TextChannel;
    const staff = await guild.channels.create({ name: "🛡 staff-room", type: ChannelType.GuildText, parent: category.id }) as TextChannel;
    const join = await guild.channels.create({ name: "✋ join", type: ChannelType.GuildText, parent: category.id }) as TextChannel;

    // ----------------- Tworzenie kanałów głosowych -----------------
    const generalVC = await guild.channels.create({ name: "🎤 General VC", type: ChannelType.GuildVoice, parent: category.id }) as VoiceChannel;
    const staffVC = await guild.channels.create({ name: "🎤 Staff VC", type: ChannelType.GuildVoice, parent: category.id }) as VoiceChannel;

    // ----------------- Zapis kanałów -----------------
    createdChannels["welcome"] = welcome;
    createdChannels["announce"] = announce;
    createdChannels["chat"] = chat;
    createdChannels["staff"] = staff;
    createdChannels["join"] = join;
    createdChannels["generalVC"] = generalVC;
    createdChannels["staffVC"] = staffVC;

    const everyoneId = guild.roles.everyone.id;

    // ----------------- Ustawienia permisji -----------------
    await welcome.permissionOverwrites.set([
      { id: everyoneId, deny: [PermissionFlagsBits.ViewChannel] },
      { id: roles.r3RoleId, allow: [PermissionFlagsBits.ViewChannel] },
      { id: roles.r4RoleId, allow: [PermissionFlagsBits.ViewChannel] },
      { id: roles.r5RoleId, allow: [PermissionFlagsBits.ViewChannel] },
    ]);

    await announce.permissionOverwrites.set([
      { id: everyoneId, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
      { id: roles.r3RoleId, allow: [PermissionFlagsBits.ViewChannel] },
      { id: roles.r4RoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
      { id: roles.r5RoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
    ]);

    await chat.permissionOverwrites.set([
      { id: everyoneId, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
      { id: roles.r3RoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
      { id: roles.r4RoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
      { id: roles.r5RoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
    ]);

    await staff.permissionOverwrites.set([
      { id: everyoneId, deny: [PermissionFlagsBits.ViewChannel] },
      { id: roles.r3RoleId, deny: [PermissionFlagsBits.ViewChannel] },
      { id: roles.r4RoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
      { id: roles.r5RoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
    ]);

    await join.permissionOverwrites.set([
      { id: everyoneId, allow: [PermissionFlagsBits.ViewChannel] },
      { id: roles.r3RoleId, deny: [PermissionFlagsBits.ViewChannel] },
      { id: roles.r4RoleId, deny: [PermissionFlagsBits.ViewChannel] },
      { id: roles.r5RoleId, deny: [PermissionFlagsBits.ViewChannel] },
    ]);

    await generalVC.permissionOverwrites.set([
      { id: everyoneId, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect] },
      { id: roles.r3RoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect] },
      { id: roles.r4RoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect] },
      { id: roles.r5RoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect] },
    ]);

    await staffVC.permissionOverwrites.set([
      { id: everyoneId, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect] },
      { id: roles.r3RoleId, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect] },
      { id: roles.r4RoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect] },
      { id: roles.r5RoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect] },
    ]);

    this.channels[allianceId] = {
      categoryId: category.id,
      welcomeId: welcome.id,
      announceId: announce.id,
      chatId: chat.id,
      staffId: staff.id,
      joinId: join.id,
      generalVCId: generalVC.id,
      staffVCId: staffVC.id,
    };

    return this.channels[allianceId];
  }

  /**
   * Oblicza liczbę członków (R3 + R4 + R5)
   */
  static calculateMemberCount(allianceId: string): number {
    const alliance = AllianceService.getAllianceOrThrow(allianceId);
    const roles = alliance.roles;
    const r3 = alliance.members.filter(m => m.roleId === roles.r3RoleId).length;
    const r4 = alliance.members.filter(m => m.roleId === roles.r4RoleId).length;
    const r5 = alliance.members.filter(m => m.roleId === roles.r5RoleId).length;
    return r3 + r4 + r5;
  }

  /**
   * Aktualizuje nazwę kategorii z dynamiczną liczbą członków i zmianą tagu/nazwy
   */
  static async updateCategoryName(guild: Guild, allianceId: string, tag?: string, name?: string) {
    const categoryId = this.channels[allianceId]?.categoryId;
    if (!categoryId) return;

    const alliance = AllianceService.getAllianceOrThrow(allianceId);
    const category = guild.channels.cache.get(categoryId) as CategoryChannel;
    if (!category) return;

    const memberCount = this.calculateMemberCount(allianceId);
    const categoryName = `🏰 ${tag || alliance.tag} | ${name || alliance.name} | ${memberCount}/100`;

    if (category.name !== categoryName) {
      await category.setName(categoryName);
    }
  }

  // ----------------- GETTERY -----------------
  static getChannel(allianceId: string, type: keyof typeof ChannelModule["channels"][string]): string | undefined {
    return this.channels[allianceId]?.[type];
  }

  static getAnnounceChannel(allianceId: string) { return this.channels[allianceId]?.announceId; }
  static getWelcomeChannel(allianceId: string) { return this.channels[allianceId]?.welcomeId; }
  static getChatChannel(allianceId: string) { return this.channels[allianceId]?.chatId; }
  static getStaffChannel(allianceId: string) { return this.channels[allianceId]?.staffId; }
  static getJoinChannel(allianceId: string) { return this.channels[allianceId]?.joinId; }
  static getGeneralVC(allianceId: string) { return this.channels[allianceId]?.generalVCId; }
  static getStaffVC(allianceId: string) { return this.channels[allianceId]?.staffVCId; }
}

/**
 * ============================================
 * FILEPATH: src/system/alliance/modules/channel/ChannelModule.ts
 * ============================================
 */