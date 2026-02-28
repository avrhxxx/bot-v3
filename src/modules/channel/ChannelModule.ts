import { Guild, CategoryChannel, TextChannel, VoiceChannel, ChannelType, GuildChannel, OverwriteResolvable } from "discord.js";

// -------------------
// CHANNEL MODULE
// -------------------
export class ChannelModule {
  private static delayMs = 300; // domyślny delay między operacjami

  private static async delay() {
    return new Promise(resolve => setTimeout(resolve, this.delayMs));
  }

  // -------------------
  // CREATE CATEGORY
  // -------------------
  static async createCategory(guild: Guild, name: string): Promise<CategoryChannel> {
    const category = await guild.channels.create({
      name,
      type: ChannelType.GuildCategory
    }) as CategoryChannel;
    await this.delay();
    return category;
  }

  // -------------------
  // CREATE TEXT CHANNEL
  // -------------------
  static async createTextChannel(
    guild: Guild,
    name: string,
    parentId?: string,
    overwrites?: OverwriteResolvable[]
  ): Promise<TextChannel> {
    const channel = await guild.channels.create({
      name,
      type: ChannelType.GuildText,
      parent: parentId,
      permissionOverwrites: overwrites
    }) as TextChannel;
    await this.delay();
    return channel;
  }

  // -------------------
  // CREATE VOICE CHANNEL
  // -------------------
  static async createVoiceChannel(
    guild: Guild,
    name: string,
    parentId?: string,
    overwrites?: OverwriteResolvable[]
  ): Promise<VoiceChannel> {
    const channel = await guild.channels.create({
      name,
      type: ChannelType.GuildVoice,
      parent: parentId,
      permissionOverwrites: overwrites
    }) as VoiceChannel;
    await this.delay();
    return channel;
  }

  // -------------------
  // DELETE CHANNEL / CATEGORY
  // -------------------
  static async deleteChannel(channel: GuildChannel): Promise<void> {
    if (!channel) return;
    await channel.delete().catch(() => {});
    await this.delay();
  }

  // -------------------
  // DELETE MULTIPLE CHANNELS
  // -------------------
  static async deleteChannels(channels: GuildChannel[]): Promise<void> {
    for (const ch of channels) {
      await this.deleteChannel(ch);
    }
  }
}