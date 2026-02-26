/**
 * ==========================================================
 * 📁 src/system/alliance/modules/channel/ChannelModule.ts
 * ==========================================================
 *
 * INFRASTRUCTURE LAYER ONLY
 *
 * - Tworzy kanały
 * - Usuwa kanały
 * - Aktualizuje nazwę kategorii
 *
 * ❗ Nie przechowuje danych
 * ❗ Nie ma cache
 * ❗ Nie zna repo
 * ❗ Nie zna AllianceService
 */

import {
  Guild,
  TextChannel,
  CategoryChannel,
  VoiceChannel,
  ChannelType
} from "discord.js";

import { AllianceChannels } from "../../AllianceTypes";

export class ChannelModule {

  // =====================================================
  // CREATE
  // =====================================================

  static async createChannels(
    guild: Guild,
    allianceId: string,
    tag: string
  ): Promise<AllianceChannels> {

    const category = await guild.channels.create({
      name: `🏰 ${tag}`,
      type: ChannelType.GuildCategory
    }) as CategoryChannel;

    const base = async (
      name: string,
      type: ChannelType
    ) =>
      guild.channels.create({
        name,
        type,
        parent: category.id
      });

    const leadership =
      await base("👑 leadership", ChannelType.GuildText) as TextChannel;

    const officers =
      await base("🛡 officers", ChannelType.GuildText) as TextChannel;

    const members =
      await base("💬 members", ChannelType.GuildText) as TextChannel;

    const join =
      await base("✋ join", ChannelType.GuildText) as TextChannel;

    const announce =
      await base("📢 announce", ChannelType.GuildText) as TextChannel;

    const welcome =
      await base("👋 welcome", ChannelType.GuildText) as TextChannel;

    return {
      categoryId: category.id,
      leadershipChannelId: leadership.id,
      officersChannelId: officers.id,
      membersChannelId: members.id,
      joinChannelId: join.id,
      announceChannelId: announce.id,
      welcomeChannelId: welcome.id
    };
  }

  // =====================================================
  // DELETE
  // =====================================================

  static async deleteChannels(
    guild: Guild,
    channels: AllianceChannels
  ): Promise<void> {

    const ids = Object.values(channels);

    for (const id of ids) {
      const channel = guild.channels.cache.get(id);
      if (channel) {
        await channel.delete().catch(() => {});
      }
    }
  }

  // =====================================================
  // UPDATE TAG (rename category)
  // =====================================================

  static async updateTag(
    guild: Guild,
    channels: AllianceChannels,
    newTag: string
  ): Promise<void> {

    const category =
      guild.channels.cache.get(channels.categoryId) as CategoryChannel;

    if (!category) return;

    await category.setName(`🏰 ${newTag}`);
  }
}