// src/modules/channel/ChannelModule.ts
import { Guild, TextChannel, VoiceChannel, CategoryChannel, ChannelType } from "discord.js";

export class ChannelModule {
  // ----------------- CREATE CHANNELS -----------------
  static async createSkeletonChannels(guild: Guild, allianceName: string) {
    // Kategorie
    let category = guild.channels.cache.find(
      c => c.type === ChannelType.GuildCategory && c.name === allianceName
    ) as CategoryChannel | undefined;

    if (!category) {
      category = await guild.channels.create({
        name: allianceName,
        type: ChannelType.GuildCategory
      });
      console.log(`Utworzono kategorię: ${category.name}`);
    }

    // Kanały tekstowe i voice
    const channelNames: { name: string; type: ChannelType }[] = [
      { name: "👋 welcome", type: ChannelType.GuildText },
      { name: "📢 announce", type: ChannelType.GuildText },
      { name: "💬 chat", type: ChannelType.GuildText },
      { name: "🛡 staff-room", type: ChannelType.GuildText },
      { name: "✋ join", type: ChannelType.GuildText },
      { name: "🎤 General VC", type: ChannelType.GuildVoice },
      { name: "🎤 Staff VC", type: ChannelType.GuildVoice }
    ];

    for (const ch of channelNames) {
      const exists = category.children.cache.find(c => c.name === ch.name && c.type === ch.type);
      if (!exists) {
        const created = await guild.channels.create({
          name: ch.name,
          type: ch.type,
          parent: category.id
        });
        console.log(`Utworzono kanał: ${created.name}`);
      }
    }
  }
}