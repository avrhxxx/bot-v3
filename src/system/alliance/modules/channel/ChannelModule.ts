/**
 * ==========================================================
 * 📁 src/system/alliance/modules/ChannelModule.ts
 * ==========================================================
 *
 * ChannelModule odpowiada WYŁĄCZNIE za infrastrukturę Discord:
 *
 * - Tworzenie kategorii i kanałów sojuszu
 * - Usuwanie kanałów
 * - Ochronę przed ręcznym usunięciem
 * - Aktualizację nazwy kategorii
 *
 * ❗ NIE przechowuje trwałych danych
 * ❗ NIE jest warstwą persistence
 *
 * ID kanałów MUSZĄ być zapisane w repository (repositories.ts)
 * przez AllianceManager po wywołaniu createChannels().
 *
 * Ten moduł jest warstwą infra, nie data layer.
 */

import {
  Guild,
  TextChannel,
  CategoryChannel,
  VoiceChannel,
  ChannelType,
  PermissionFlagsBits,
  OverwriteResolvable,
  Channel
} from "discord.js";
import { AllianceService } from "../AllianceService";

export class ChannelModule {

  /**
   * =====================================================
   * RUNTIME CACHE
   * =====================================================
   *
   * Cache istnieje wyłącznie podczas działania bota.
   * Nie jest źródłem prawdy.
   * Po restarcie powinien być odbudowany z repository.
   */
  private static channels: Record<string, Record<string, string>> = {};

  /**
   * =====================================================
   * CREATE CHANNELS (ONLY ENTRY POINT)
   * =====================================================
   *
   * Tworzy pełną infrastrukturę sojuszu:
   * - kategorię
   * - 5 kanałów tekstowych
   * - 2 kanały głosowe
   *
   * Zwraca mapę ID.
   *
   * ⚠ AllianceManager musi zapisać te ID w repository.
   */
  static async createChannels(
    guild: Guild,
    allianceId: string,
    tag: string,
    name: string
  ) {

    if (this.channels[allianceId]) {
      throw new Error("Channels already exist for this alliance.");
    }

    const alliance = AllianceService.getAllianceOrThrow(allianceId);
    const memberCount = this.getMemberCount(allianceId);

    const category = await guild.channels.create({
      name: `🏰 ${tag} | ${name} | ${memberCount}/100`,
      type: ChannelType.GuildCategory
    }) as CategoryChannel;

    const created = await this.createChildChannels(guild, category);

    const result = {
      categoryId: category.id,
      ...created
    };

    this.channels[allianceId] = result;

    return result;
  }

  /**
   * =====================================================
   * DELETE CHANNELS (ONLY ENTRY POINT)
   * =====================================================
   *
   * Usuwa wszystkie kanały należące do sojuszu.
   *
   * AllianceManager powinien wcześniej pobrać ID
   * z repository i przekazać allianceId.
   */
  static async deleteChannels(guild: Guild, allianceId: string) {

    const cache = this.channels[allianceId];
    if (!cache) return;

    for (const id of Object.values(cache)) {
      const channel = guild.channels.cache.get(id);
      if (channel) {
        await channel.delete().catch(() => {});
      }
    }

    delete this.channels[allianceId];
  }

  /**
   * =====================================================
   * MANUAL DELETE PROTECTION
   * =====================================================
   *
   * Wykrywa ręczne usunięcie kanału i odtwarza
   * całą infrastrukturę.
   */
  static async handleChannelDelete(channel: Channel) {

    const allianceId = this.findAllianceByChannelId(channel.id);
    if (!allianceId) return;

    const alliance = AllianceService.getAllianceOrThrow(allianceId);

    await this.deleteChannels(channel.guild, allianceId);

    await this.createChannels(
      channel.guild,
      alliance.id,
      alliance.tag,
      alliance.name
    );
  }

  /**
   * =====================================================
   * INTERNAL HELPERS
   * =====================================================
   */

  private static async createChildChannels(
    guild: Guild,
    category: CategoryChannel
  ) {

    const base = async (name: string, type: ChannelType) =>
      guild.channels.create({ name, type, parent: category.id });

    const welcome = await base("👋 welcome", ChannelType.GuildText) as TextChannel;
    const announce = await base("📢 announce", ChannelType.GuildText) as TextChannel;
    const chat = await base("💬 chat", ChannelType.GuildText) as TextChannel;
    const staff = await base("🛡 staff-room", ChannelType.GuildText) as TextChannel;
    const join = await base("✋ join", ChannelType.GuildText) as TextChannel;
    const generalVC = await base("🎤 General VC", ChannelType.GuildVoice) as VoiceChannel;
    const staffVC = await base("🎤 Staff VC", ChannelType.GuildVoice) as VoiceChannel;

    return {
      welcomeId: welcome.id,
      announceId: announce.id,
      chatId: chat.id,
      staffId: staff.id,
      joinId: join.id,
      generalVCId: generalVC.id,
      staffVCId: staffVC.id
    };
  }

  private static findAllianceByChannelId(channelId: string): string | undefined {
    for (const [allianceId, map] of Object.entries(this.channels)) {
      if (Object.values(map).includes(channelId)) {
        return allianceId;
      }
    }
    return undefined;
  }

  private static getMemberCount(allianceId: string): number {
    const alliance = AllianceService.getAllianceOrThrow(allianceId);

    let count = 0;
    if (alliance.members.r3) count += alliance.members.r3.length;
    if (alliance.members.r4) count += alliance.members.r4.length;
    if (alliance.members.r5) count += 1;

    return count;
  }
}