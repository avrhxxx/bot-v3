import {
  Guild, TextChannel, CategoryChannel, VoiceChannel,
  ChannelType, Channel
} from "discord.js";
import { AllianceService } from "../AllianceService";

/**
 * ChannelModule odpowiada WYŁĄCZNIE za infrastrukturę Discord
 * Kanały tworzone i usuwane tylko przez create/delete w tym module
 */
export class ChannelModule {
  private static channels: Record<string, Record<string, string>> = {};

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
    this.channels[allianceId] = result;
    return result;
  }

  static async deleteChannels(guild: Guild, allianceId: string) {
    const cache = this.channels[allianceId];
    if (!cache) return;

    for (const id of Object.values(cache)) {
      const channel = guild.channels.cache.get(id);
      if (channel) await channel.delete().catch(() => {});
    }

    delete this.channels[allianceId];
  }

  static async handleChannelDelete(channel: Channel) {
    const allianceId = this.findAllianceByChannelId(channel.id);
    if (!allianceId) return;

    const alliance = AllianceService.getAllianceOrThrow(allianceId);

    await this.deleteChannels(channel.guild, allianceId);
    await this.createChannels(channel.guild, alliance.id, alliance.tag, alliance.name);
  }

  private static async createChildChannels(
    guild: Guild,
    category: CategoryChannel
  ) {
    const base = async (name: string, type: ChannelType) => guild.channels.create({ name, type, parent: category.id });
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