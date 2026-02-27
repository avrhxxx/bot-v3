import { Guild, CategoryChannel, TextChannel, VoiceChannel, ChannelType } from "discord.js";

export class ChannelModule {
  // Mapowanie kanałów stworzonych dla sojuszy
  private static allianceChannels: Record<string, Record<string, string>> = {};

  /**
   * Tworzy kategorię i podstawowe kanały dla sojuszu
   * @param guild - serwer Discord
   * @param allianceId - unikalny ID sojuszu
   * @param allianceTag - tag sojuszu
   * @param allianceName - pełna nazwa sojuszu (używana jako nazwa kategorii)
   */
  static async createChannels(
    guild: Guild,
    allianceId: string,
    allianceTag: string,
    allianceName: string
  ) {
    if (this.allianceChannels[allianceId]) {
      console.log(`Kanały dla sojuszu ${allianceTag} już istnieją.`);
      return this.allianceChannels[allianceId];
    }

    // Tworzymy kategorię
    let category = guild.channels.cache.find(
      c => c.name === allianceName && c.type === ChannelType.GuildCategory
    ) as CategoryChannel;

    if (!category) {
      category = await guild.channels.create({
        name: allianceName,
        type: ChannelType.GuildCategory,
        reason: `Automatyczne tworzenie kategorii dla sojuszu ${allianceName}`
      }) as CategoryChannel;

      console.log(`Stworzono kategorię: ${category.name}`);
    }

    // Funkcja pomocnicza do tworzenia kanału jeśli nie istnieje
    const createIfNotExist = async (name: string, type: ChannelType) => {
      let channel = guild.channels.cache.find(
        c => c.name === name && c.parentId === category.id
      );
      if (!channel) {
        channel = await guild.channels.create({
          name,
          type,
          parent: category.id,
          reason: `Automatyczne tworzenie kanału dla sojuszu ${allianceName}`
        });
        console.log(`Stworzono kanał: ${name}`);
      }
      return channel.id;
    };

    // Tworzymy kanały tekstowe
    const welcomeId = await createIfNotExist("👋 welcome", ChannelType.GuildText);
    const announceId = await createIfNotExist("📢 announce", ChannelType.GuildText);
    const chatId = await createIfNotExist("💬 chat", ChannelType.GuildText);
    const staffId = await createIfNotExist("🛡 staff-room", ChannelType.GuildText);
    const joinId = await createIfNotExist("✋ join", ChannelType.GuildText);

    // Tworzymy kanały voice
    const generalVCId = await createIfNotExist("🎤 General VC", ChannelType.GuildVoice);
    const staffVCId = await createIfNotExist("🎤 Staff VC", ChannelType.GuildVoice);

    // Zapisujemy do mapy
    const createdChannels = {
      categoryId: category.id,
      welcomeId,
      announceId,
      chatId,
      staffId,
      joinId,
      generalVCId,
      staffVCId
    };

    this.allianceChannels[allianceId] = createdChannels;
    return createdChannels;
  }

  /**
   * Pobiera ID kanału po ID sojuszu
   */
  static getChannelId(allianceId: string, key: keyof typeof ChannelModule["allianceChannels"][string]) {
    return this.allianceChannels[allianceId]?.[key];
  }
}