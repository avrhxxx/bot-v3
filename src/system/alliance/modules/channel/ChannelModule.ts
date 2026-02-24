/**
 * ============================================
 * FILE: src/system/alliance/ChannelModule/ChannelModule.ts
 * LAYER: SYSTEM (Alliance Channel Module)
 * ============================================
 *
 * ODPOWIEDZIALNOŚĆ:
 * - Tworzenie, aktualizacja i usuwanie kanałów Discord dla sojuszu
 * - Ustawianie uprawnień widoczności i pisania
 * - Integracja z AllianceService i RoleModule
 *
 * ZALEŻNOŚCI:
 * - AllianceService (pobranie danych sojuszu)
 * - RoleModule (role R5/R4/R3)
 *
 * UWAGA:
 * - Kanały pod kategorią nazwaną nazwą sojuszu
 * - Welcome i Announce na górze, chat niżej, Staff Room i Join na dole
 * - Join widoczny tylko dla osób spoza sojuszu
 *
 * ============================================
 */

import { Guild, TextChannel, PermissionFlagsBits, CategoryChannel, ChannelType } from "discord.js";
import { AllianceService } from "../AllianceService";
import { RoleModule } from "../RoleModule/RoleModule";

export class ChannelModule {
  private static announceChannels: Record<string, string> = {};
  private static chatChannels: Record<string, string> = {};
  private static staffChannels: Record<string, string> = {};
  private static welcomeChannels: Record<string, string> = {};
  private static joinChannels: Record<string, string> = {};

  // ----------------- CREATE CHANNELS -----------------
  static async createChannels(guild: Guild, allianceId: string, tag: string) {
    const alliance = AllianceService.getAllianceOrThrow(allianceId);
    const roles = alliance.roles;

    // CATEGORY
    const category = await guild.channels.create({
      name: alliance.name,
      type: ChannelType.GuildCategory,
    }) as CategoryChannel;

    // WELCOME
    const welcome = await guild.channels.create({
      name: "welcome",
      type: ChannelType.GuildText,
      parent: category.id,
    }) as TextChannel;

    // ANNOUNCE
    const announce = await guild.channels.create({
      name: "announce",
      type: ChannelType.GuildText,
      parent: category.id,
    }) as TextChannel;

    // CHAT
    const chat = await guild.channels.create({
      name: "chat",
      type: ChannelType.GuildText,
      parent: category.id,
    }) as TextChannel;

    // STAFF ROOM
    const staff = await guild.channels.create({
      name: "staff-room",
      type: ChannelType.GuildText,
      parent: category.id,
    }) as TextChannel;

    // JOIN
    const join = await guild.channels.create({
      name: "join",
      type: ChannelType.GuildText,
      parent: category.id,
    }) as TextChannel;

    // ----------------- PERMISSIONS -----------------
    const everyoneId = guild.roles.everyone.id;

    await welcome.permissionOverwrites.set([
      { id: everyoneId, deny: [PermissionFlagsBits.ViewChannel] },
      { id: roles.r5RoleId, allow: [PermissionFlagsBits.ViewChannel] },
      { id: roles.r4RoleId, allow: [PermissionFlagsBits.ViewChannel] },
      { id: roles.r3RoleId, allow: [PermissionFlagsBits.ViewChannel] },
    ]);

    await announce.permissionOverwrites.set([
      { id: everyoneId, deny: [PermissionFlagsBits.ViewChannel] },
      { id: roles.r5RoleId, allow: [PermissionFlagsBits.ViewChannel] },
      { id: roles.r4RoleId, allow: [PermissionFlagsBits.ViewChannel] },
      { id: roles.r3RoleId, allow: [PermissionFlagsBits.ViewChannel] },
    ]);

    await chat.permissionOverwrites.set([
      { id: everyoneId, deny: [PermissionFlagsBits.ViewChannel] },
      { id: roles.r5RoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
      { id: roles.r4RoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
      { id: roles.r3RoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
    ]);

    await staff.permissionOverwrites.set([
      { id: everyoneId, deny: [PermissionFlagsBits.ViewChannel] },
      { id: roles.r5RoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
      { id: roles.r4RoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
    ]);

    await join.permissionOverwrites.set([
      { id: everyoneId, allow: [PermissionFlagsBits.ViewChannel] },
      { id: roles.r5RoleId, deny: [PermissionFlagsBits.ViewChannel] },
      { id: roles.r4RoleId, deny: [PermissionFlagsBits.ViewChannel] },
      { id: roles.r3RoleId, deny: [PermissionFlagsBits.ViewChannel] },
    ]);

    // ----------------- STORE IDS -----------------
    this.welcomeChannels[allianceId] = welcome.id;
    this.announceChannels[allianceId] = announce.id;
    this.chatChannels[allianceId] = chat.id;
    this.staffChannels[allianceId] = staff.id;
    this.joinChannels[allianceId] = join.id;

    return {
      categoryId: category.id,
      welcomeId: welcome.id,
      announceId: announce.id,
      chatId: chat.id,
      staffId: staff.id,
      joinId: join.id,
    };
  }

  // ----------------- UPDATE VISIBILITY -----------------
  static async updateChannelVisibility(allianceId: string) {
    const alliance = AllianceService.getAllianceOrThrow(allianceId);
    const roles = alliance.roles;

    // implementacja aktualizacji widoczności według ról
  }

  // ----------------- DELETE CHANNELS -----------------
  static async deleteChannels(allianceId: string) {
    const guild = AllianceService.getAllianceOrThrow(allianceId).guild;

    const ids = [
      this.welcomeChannels[allianceId],
      this.announceChannels[allianceId],
      this.chatChannels[allianceId],
      this.staffChannels[allianceId],
      this.joinChannels[allianceId],
    ];

    for (const id of ids) {
      const channel = guild.channels.cache.get(id);
      if (channel) await channel.delete();
    }

    delete this.welcomeChannels[allianceId];
    delete this.announceChannels[allianceId];
    delete this.chatChannels[allianceId];
    delete this.staffChannels[allianceId];
    delete this.joinChannels[allianceId];
  }

  // ----------------- GETTERS -----------------
  static getWelcomeChannel(allianceId: string): string | undefined {
    return this.welcomeChannels[allianceId];
  }

  static getAnnounceChannel(allianceId: string): string | undefined {
    return this.announceChannels[allianceId];
  }

  static getChatChannel(allianceId: string): string | undefined {
    return this.chatChannels[allianceId];
  }

  static getStaffChannel(allianceId: string): string | undefined {
    return this.staffChannels[allianceId];
  }

  static getJoinChannel(allianceId: string): string | undefined {
    return this.joinChannels[allianceId];
  }
}