// src/system/alliance/modules/ChannelModule.ts

import {
  Guild, TextChannel, CategoryChannel, VoiceChannel,
  ChannelType, Channel
} from "discord.js";
import { AllianceManager } from "../AllianceManager";
import { AllianceRepo } from "../../../data/Repositories";

/**
 * =====================================================
 * ChannelModule – Discord Infrastructure
 * =====================================================
 *
 * - Tworzy i usuwa kategorię + kanały sojuszu
 * - Chroni przed ręcznym usunięciem
 * - Aktualizuje nazwę kategorii
 *
 * ⚠ Nie jest warstwą persistence – ID kanałów
 * muszą być zapisane w repository przez AllianceManager
 * =====================================================
 */
export class ChannelModule {

  /** Runtime cache kanałów – tylko dla szybkiego dostępu */
  private static channels: Record<string, Record<string, string>> = {};

  // =====================================================
  // CREATE CHANNELS (ENTRY POINT)
  // =====================================================
  static async createChannels(
    guild: Guild,
    allianceId: string,
    tag: string,
    name: string
  ) {

    if (this.channels[allianceId])
      throw new Error("Channels already exist for this alliance.");

    const category = await guild.channels.create({
      name: `🏰 ${tag} | ${name} | 0/100`,
      type: ChannelType.GuildCategory
    }) as CategoryChannel;

    const created = await this.createChildChannels(guild, category);

    const result = { categoryId: category.id, ...created };

    // -----------------------
    // Update runtime cache
    // -----------------------
    this.channels[allianceId] = result;

    // -----------------------
    // Update repository (source of truth)
    // -----------------------
    const alliance = AllianceManager.getAllianceOrThrow(allianceId);
    alliance.channels = result;
    AllianceRepo.set(allianceId, alliance);

    return result;
  }

  // =====================================================
  // DELETE CHANNELS (ENTRY POINT)
  // =====================================================
  static async deleteChannels(guild: Guild, allianceId: string) {
    const cache = this.channels[allianceId] || AllianceManager.getAllianceOrThrow(allianceId).channels;
    if (!cache) return;

    for (const id of Object.values(cache)) {
      const channel = guild.channels.cache.get(id);
      if (channel) await channel.delete().catch(() => {});
    }

    delete this.channels[allianceId];

    // Clear from repository
    const alliance = AllianceManager.getAllianceOrThrow(allianceId);
    alliance.channels = {} as any;
    AllianceRepo.set(allianceId, alliance);
  }

  // =====================================================
  // MANUAL DELETE PROTECTION
  // =====================================================
  static async handleChannelDelete(channel: Channel) {
    const allianceId = this.findAllianceByChannelId(channel.id);
    if (!allianceId) return;

    const alliance = AllianceManager.getAllianceOrThrow(allianceId);

    await this.deleteChannels(channel.guild, allianceId);
    await this.createChannels(channel.guild, alliance.id, alliance.tag, alliance.name);
  }

  // =====================================================
  // INTERNAL HELPERS
  // =====================================================
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
      if (Object.values(map).includes(channelId)) return allianceId;
    }
    return undefined;
  }
}