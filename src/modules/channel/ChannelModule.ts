// src/modules/channel/ChannelModule.ts
import { 
  Guild, 
  CategoryChannel, 
  TextChannel, 
  VoiceChannel, 
  ChannelType, 
  GuildChannel, 
  PermissionOverwrites, 
  Role 
} from "discord.js";

// -------------------
// CHANNEL MODULE
// -------------------
export class ChannelModule {
  private delayMs: number;

  constructor(delayMs = 300) {
    this.delayMs = delayMs; // lokalny delay między operacjami
  }

  private async delay() {
    return new Promise(resolve => setTimeout(resolve, this.delayMs));
  }

  // -------------------
  // CREATE CATEGORY
  // -------------------
  public async createCategory(
    guild: Guild, 
    name: string, 
    permissionOverwrites?: PermissionOverwrites[]
  ): Promise<CategoryChannel> {
    const category = await guild.channels.create({
      name,
      type: ChannelType.GuildCategory,
      permissionOverwrites
    }) as CategoryChannel;
    await this.delay();
    return category;
  }

  // -------------------
  // CREATE TEXT CHANNEL
  // -------------------
  public async createTextChannel(
    guild: Guild, 
    name: string, 
    parent?: CategoryChannel, 
    permissionOverwrites?: PermissionOverwrites[]
  ): Promise<TextChannel> {
    const channel = await guild.channels.create({
      name,
      type: ChannelType.GuildText,
      parent: parent?.id,
      permissionOverwrites
    }) as TextChannel;
    await this.delay();
    return channel;
  }

  // -------------------
  // CREATE VOICE CHANNEL
  // -------------------
  public async createVoiceChannel(
    guild: Guild, 
    name: string, 
    parent?: CategoryChannel, 
    permissionOverwrites?: PermissionOverwrites[]
  ): Promise<VoiceChannel> {
    const channel = await guild.channels.create({
      name,
      type: ChannelType.GuildVoice,
      parent: parent?.id,
      permissionOverwrites
    }) as VoiceChannel;
    await this.delay();
    return channel;
  }

  // -------------------
  // DELETE CHANNEL / CATEGORY
  // -------------------
  public async deleteChannel(channel: GuildChannel): Promise<void> {
    if (!channel) return;
    await channel.delete().catch(() => {});
    await this.delay();
  }

  // -------------------
  // DELETE MULTIPLE CHANNELS
  // -------------------
  public async deleteChannels(channels: GuildChannel[]): Promise<void> {
    for (const ch of channels) {
      await this.deleteChannel(ch);
    }
  }
}