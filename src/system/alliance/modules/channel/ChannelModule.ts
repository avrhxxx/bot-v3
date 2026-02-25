/**
 * ============================================
 * FILE: src/system/alliance/ChannelModule/ChannelModule.ts
 * LAYER: SYSTEM (Alliance Channel Management Module)
 * ============================================
 *
 * ODPOWIEDZIALNOŚĆ:
 * - Tworzenie i zarządzanie kanałami sojuszu na Discord
 * - Ustawienie widoczności kanałów dla R5/R4/R3 oraz osób spoza sojuszu
 * - Zapewnienie spójności z kategorią sojuszu
 *
 * ZALEŻNOŚCI:
 * - AllianceService (dane sojuszu i role)
 *
 * UWAGA:
 * - Kanały są zawsze tworzone w stałym pakiecie:
 *   Welcome → Announce → Chat → Staff Room → Join
 * - Join widoczny dla osób spoza sojuszu, pozostali go nie widzą
 * - Staff Room widoczny tylko dla R5 i R4
 *
 * ============================================
 */

import { Guild, TextChannel, CategoryChannel, ChannelType, PermissionFlagsBits } from "discord.js";
import { AllianceService } from "../AllianceService";
import { RoleModule } from "../rol/RoleModule"; // <- poprawiona ścieżka

export class ChannelModule {
  private static channels: Record<string, Record<string, string>> = {};

  // ----------------- CREATE CHANNELS -----------------
  static async createChannels(guild: Guild, allianceId: string, tag: string, name: string) {
    const alliance = AllianceService.getAllianceOrThrow(allianceId);
    const roles = alliance.roles;

    const createdChannels: Record<string, TextChannel> = {};

    // Tworzenie kategorii
    const category = await guild.channels.create({
      name,
      type: ChannelType.GuildCategory,
    }) as CategoryChannel;

    // 1️⃣ Welcome
    const welcome = await guild.channels.create({
      name: "welcome",
      type: ChannelType.GuildText,
      parent: category.id,
    }) as TextChannel;

    // 2️⃣ Announce
    const announce = await guild.channels.create({
      name: "announce",
      type: ChannelType.GuildText,
      parent: category.id,
    }) as TextChannel;

    // 3️⃣ Chat (czat)
    const chat = await guild.channels.create({
      name: "chat",
      type: ChannelType.GuildText,
      parent: category.id,
    }) as TextChannel;

    // 4️⃣ Staff Room
    const staff = await guild.channels.create({
      name: "staff-room",
      type: ChannelType.GuildText,
      parent: category.id,
    }) as TextChannel;

    // 5️⃣ Join
    const join = await guild.channels.create({
      name: "join",
      type: ChannelType.GuildText,
      parent: category.id,
    }) as TextChannel;

    createdChannels["welcome"] = welcome;
    createdChannels["announce"] = announce;
    createdChannels["chat"] = chat;
    createdChannels["staff"] = staff;
    createdChannels["join"] = join;

    // ----------------- USTAWIENIE UPRAWNIEŃ -----------------
    const everyoneId = guild.roles.everyone.id;

    // Welcome: tylko bot może pisać
    await welcome.permissionOverwrites.set([
      { id: everyoneId, deny: [PermissionFlagsBits.ViewChannel] },
    ]);

    // Announce: tylko bot pisze, R5 i R4 widzą
    await announce.permissionOverwrites.set([
      { id: everyoneId, deny: [PermissionFlagsBits.ViewChannel] },
      { id: roles.r5RoleId, allow: [PermissionFlagsBits.ViewChannel] },
      { id: roles.r4RoleId, allow: [PermissionFlagsBits.ViewChannel] },
    ]);

    // Chat: wszyscy członkowie R3+R4+R5 mogą pisać i widzieć
    await chat.permissionOverwrites.set([
      { id: everyoneId, deny: [PermissionFlagsBits.ViewChannel] },
      { id: roles.r3RoleId, allow: [PermissionFlagsBits.ViewChannel] },
      { id: roles.r4RoleId, allow: [PermissionFlagsBits.ViewChannel] },
      { id: roles.r5RoleId, allow: [PermissionFlagsBits.ViewChannel] },
    ]);

    // Staff Room: tylko R4 i R5
    await staff.permissionOverwrites.set([
      { id: everyoneId, deny: [PermissionFlagsBits.ViewChannel] },
      { id: roles.r4RoleId, allow: [PermissionFlagsBits.ViewChannel] },
      { id: roles.r5RoleId, allow: [PermissionFlagsBits.ViewChannel] },
    ]);

    // Join: widoczny publicznie, tylko bot pisze
    await join.permissionOverwrites.set([
      { id: everyoneId, allow: [PermissionFlagsBits.ViewChannel] },
    ]);

    // ----------------- ZAPIS ID -----------------
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

  // ----------------- GETTERS -----------------
  static getChannel(allianceId: string, type: keyof typeof ChannelModule["channels"][string]): string | undefined {
    return this.channels[allianceId]?.[type];
  }

  static getAnnounceChannel(allianceId: string) {
    return this.channels[allianceId]?.announceId;
  }

  static getWelcomeChannel(allianceId: string) {
    return this.channels[allianceId]?.welcomeId;
  }

  static getChatChannel(allianceId: string) {
    return this.channels[allianceId]?.chatId;
  }

  static getStaffChannel(allianceId: string) {
    return this.channels[allianceId]?.staffId;
  }

  static getJoinChannel(allianceId: string) {
    return this.channels[allianceId]?.joinId;
  }
}

/**
 * ============================================
 * FILEPATH: src/system/alliance/ChannelModule/ChannelModule.ts
 * ============================================
 */