import { Guild, CategoryChannel, TextChannel, ChannelType } from "discord.js";

export class ChannelModule {
  static async setupAllianceChannels(guild: Guild, allianceName: string) {
    // Tworzymy kategorię
    let category = guild.channels.cache.find(
      c => c.name === allianceName && c.type === ChannelType.GuildCategory
    ) as CategoryChannel | undefined;

    if (!category) {
      category = await guild.channels.create({
        name: allianceName,
        type: ChannelType.GuildCategory,
      });
      console.log(`Utworzono kategorię: ${allianceName}`);
    }

    // Tworzymy przykładowy kanał tekstowy
    const textChannelName = "ogłoszenia";
    let textChannel = category.children.find(
      c => c.name === textChannelName && c.isTextBased()
    ) as TextChannel | undefined;

    if (!textChannel) {
      textChannel = await guild.channels.create({
        name: textChannelName,
        type: ChannelType.GuildText,
        parent: category,
      });
      console.log(`Utworzono kanał tekstowy: ${textChannelName}`);
    }
  }
}