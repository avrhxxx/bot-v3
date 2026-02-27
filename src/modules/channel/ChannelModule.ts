import { Guild, TextChannel, CategoryChannel, VoiceChannel, ChannelType, PermissionFlagsBits } from "discord.js";

export class ChannelModule {
  constructor(private guild: Guild) {}

  async createAllianceCategory(name: string) {
    let category = this.guild.channels.cache.find(
      ch => ch.name === name && ch.type === ChannelType.GuildCategory
    ) as CategoryChannel;

    if (!category) {
      category = await this.guild.channels.create({
        name,
        type: ChannelType.GuildCategory,
      });
    }
    return category;
  }

  async createAllianceChannels(category: CategoryChannel) {
    const textName = `${category.name}-text`;
    const voiceName = `${category.name}-voice`;

    if (!category.children.find(ch => ch.name === textName)) {
      await this.guild.channels.create({
        name: textName,
        type: ChannelType.GuildText,
        parent: category,
        permissionOverwrites: [
          { id: category.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
        ],
      });
    }

    if (!category.children.find(ch => ch.name === voiceName)) {
      await this.guild.channels.create({
        name: voiceName,
        type: ChannelType.GuildVoice,
        parent: category,
      });
    }
  }
}