import { Guild, ChannelType, OverwriteResolvable, PermissionFlagsBits, TextChannel, VoiceChannel } from "discord.js";

export class ChannelModule {
  static async createTextChannel(
    guild: Guild,
    name: string,
    parentId: string | undefined,
    overwrites: OverwriteResolvable[]
  ): Promise<TextChannel> {
    let ch = guild.channels.cache.find(c => c.name === name && c.parentId === parentId) as TextChannel;
    if (!ch) {
      ch = await guild.channels.create({ name, type: ChannelType.GuildText, parent: parentId, permissionOverwrites: overwrites });
    } else {
      await ch.permissionOverwrites.set(overwrites);
    }
    return ch;
  }

  static async createVoiceChannel(
    guild: Guild,
    name: string,
    parentId: string | undefined,
    overwrites: OverwriteResolvable[]
  ): Promise<VoiceChannel> {
    let ch = guild.channels.cache.find(c => c.name === name && c.parentId === parentId) as VoiceChannel;
    if (!ch) {
      ch = await guild.channels.create({ name, type: ChannelType.GuildVoice, parent: parentId, permissionOverwrites: overwrites });
    } else {
      await ch.permissionOverwrites.set(overwrites);
    }
    return ch;
  }
}