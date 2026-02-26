/**
 * ==========================================================
 * 📁 src/system/alliance/modules/ChannelModule.ts
 * MODULE: ChannelModule
 * LAYER: SYSTEM (Discord Infrastructure)
 * ==========================================================
 *
 * RESPONSIBILITY:
 * - Zarządzanie kanałami i kategoriami sojuszu w Discord
 * - Tworzenie, usuwanie, aktualizacja nazw kanałów
 * - Ochrona przed ręcznym usunięciem kanałów
 *
 * ⚠️ NOTA:
 * - NIE przechowuje trwałych danych
 * - NIE zarządza logiką sojuszu
 * - Dane ID kanałów muszą być zapisane w repository (AllianceRepo)
 */

import {
  Guild,
  TextChannel,
  CategoryChannel,
  VoiceChannel,
  ChannelType,
  Channel
} from "discord.js";
import { AllianceManager } from "../AllianceManager";

export class ChannelModule {

  /**
   * =====================================================
   * RUNTIME CACHE
   * =====================================================
   *
   * Cache istnieje wyłącznie podczas działania bota.
   * Nie jest źródłem prawdy – po restarcie musi zostać odbudowany
   * z danych zapisanych w repozytorium.
   */
  private static channels: Record<string, Record<string, string>> = {};

  // =====================================================
  // CREATE CHANNELS
  // =====================================================

  /**
   * Tworzy pełną strukturę kanałów dla sojuszu
   * @param guild - obiekt Discord Guild
   * @param allianceId - ID sojuszu
   * @param tag - tag sojuszu
   * @param name - nazwa sojuszu
   * @returns obiekt z ID wszystkich utworzonych kanałów
   * @throws jeśli kanały dla sojuszu już istnieją
   */
  static async createChannels(
    guild: Guild,
    allianceId: string,
    tag: string,
    name: string
  ) {
    if (this.channels[allianceId])
      throw new Error("Channels already exist for this alliance.");

    const alliance = AllianceManager.getAllianceOrThrow(allianceId);
    const memberCount = this.getMemberCount(alliance);

    const category = await guild.channels.create({
      name: `🏰 ${tag} | ${name} | ${memberCount}/100`,
      type: ChannelType.GuildCategory
    }) as CategoryChannel;

    const created = await this.createChildChannels(guild, category);

    const result = { categoryId: category.id, ...created };
    this.channels[allianceId] = result;

    return result;
  }

  // =====================================================
  // DELETE CHANNELS
  // =====================================================

  /**
   * Usuwa wszystkie kanały sojuszu z Discord
   * @param guild - obiekt Discord Guild
   * @param allianceId - ID sojuszu
   */
  static async deleteChannels(guild: Guild, allianceId: string) {
    const cache = this.channels[allianceId];
    if (!cache) return;

    for (const id of Object.values(cache)) {
      const channel = guild.channels.cache.get(id);
      if (channel) await channel.delete().catch(() => {});
    }

    delete this.channels[allianceId];
  }

  // =====================================================
  // MANUAL DELETE PROTECTION
  // =====================================================

  /**
   * Obsługuje sytuację ręcznego usunięcia kanału przez Discord
   * - odnajduje powiązany sojusz
   * - usuwa pozostałe kanały
   * - tworzy kanały ponownie
   * @param channel - usunięty kanał Discord
   */
  static async handleChannelDelete(channel: Channel) {
    const allianceId = this.findAllianceByChannelId(channel.id);
    if (!allianceId) return;

    const alliance = AllianceManager.getAllianceOrThrow(allianceId);

    await this.deleteChannels(channel.guild, allianceId);
    await this.createChannels(
      channel.guild,
      alliance.id,
      alliance.tag,
      alliance.name
    );
  }

  // =====================================================
  // UPDATE CATEGORY NAME
  // =====================================================

  /**
   * Aktualizuje dynamicznie nazwę kategorii sojuszu
   * - dodaje tag sojuszu
   * - dodaje nazwę sojuszu
   * - aktualizuje liczbę członków
   * @param allianceId - ID sojuszu
   * @param guild - obiekt Discord Guild
   */
  static async updateCategoryName(allianceId: string, guild: Guild) {
    const alliance = AllianceManager.getAllianceOrThrow(allianceId);
    const categoryId = this.channels[allianceId]?.categoryId;
    if (!categoryId) return;

    const category = guild.channels.cache.get(categoryId) as CategoryChannel;
    if (!category) return;

    const totalMembers = this.getMemberCount(alliance);
    const newName = `🏰 ${alliance.tag} | ${alliance.name} | ${totalMembers}/100`;

    if (category.name !== newName) {
      await category.setName(newName);
    }
  }

  // =====================================================
  // INTERNAL HELPERS
  // =====================================================

  /**
   * Tworzy wszystkie podkanały wewnątrz kategorii sojuszu
   * @param guild - obiekt Discord Guild
   * @param category - obiekt kategorii Discord
   * @returns obiekt z ID wszystkich utworzonych kanałów
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

  /**
   * Znajduje sojusz po ID kanału
   * @param channelId - ID kanału Discord
   * @returns ID sojuszu lub undefined
   */
  private static findAllianceByChannelId(channelId: string): string | undefined {
    for (const [allianceId, map] of Object.entries(this.channels)) {
      if (Object.values(map).includes(channelId)) return allianceId;
    }
    return undefined;
  }

  /**
   * Oblicza liczbę wszystkich członków sojuszu
   * @param alliance - obiekt sojuszu
   * @returns liczba członków
   */
  private static getMemberCount(alliance: ReturnType<typeof AllianceManager.getAllianceOrThrow>): number {
    const r3 = alliance.members.r3?.length || 0;
    const r4 = alliance.members.r4?.length || 0;
    const r5 = alliance.members.r5 ? 1 : 0;
    return r3 + r4 + r5;
  }
}