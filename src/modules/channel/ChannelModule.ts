import { Guild, ChannelType, CategoryChannel, TextChannel, VoiceChannel } from "discord.js";

export class ChannelModule {
  private static channels: Record<string, Record<string, string>> = {};

  static async createChannels(
    guild: Guild,
    allianceId: string,
    tag: string,
    name: string
  ) {
    if (this.channels[allianceId]) return;

    const category = await guild.channels.create({
      name: `🏰 ${tag} | ${name} | 0/100`,
      type: ChannelType.GuildCategory
    }) as CategoryChannel;

    const childNames = [
      "👋 welcome",
      "📢 announce",
      "💬 chat",
      "🛡 staff-room",
      "✋ join",
      "🎤 General VC",
      "🎤 Staff VC"
    ];

    const created: Record<string, string> = {};
    for (const name of childNames) {
      const type = name.includes("VC") ? ChannelType.GuildVoice : ChannelType.GuildText;
      const ch = await guild.channels.create({ name, type, parent: category.id });
      created[name] = ch.id;
    }

    this.channels[allianceId] = { categoryId: category.id, ...created };
    console.log(`Stworzono szkielet kanałów dla ${tag} | ${name}`);
  }
}