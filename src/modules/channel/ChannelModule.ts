import {
  Guild,
  TextChannel,
  VoiceChannel,
  CategoryChannel,
  ChannelType
} from "discord.js";

export class ChannelModule {
  // Mapowanie kanałów dla sojuszy
  private static channels: Record<string, Record<string, string>> = {};

  /**
   * Tworzy szkielet kanałów dla sojuszu
   * @param guild - serwer Discord
   * @param allianceId - unikalne ID sojuszu
   * @param allianceTag - tag sojuszu
   * @param allianceName - pełna nazwa sojuszu
   */
  static async createChannels(
    guild: Guild,
    allianceId: string,
    allianceTag: string,
    allianceName: string
  ) {
    if (this.channels[allianceId]) {
      console.log(`Kanały dla sojuszu ${allianceTag} już istnieją.`);
      return this.channels[allianceId];
    }

    // Tworzymy kategorię z nazwą sojuszu
    const category = await guild.channels.create({
      name: allianceName,
      type: ChannelType.GuildCategory
    }) as CategoryChannel;

    // Tworzymy tekstowe i głosowe kanały w kategorii
    const createText = async (name: string) =>
      guild.channels.create({
        name,
        type: ChannelType.GuildText,
        parent: category.id
      }) as Promise<TextChannel>;

    const createVoice = async (name: string) =>
      guild.channels.create({
        name,
        type: ChannelType.GuildVoice,
        parent: category.id
      }) as Promise<VoiceChannel>;

    const welcome = await createText("👋 welcome");
    const announce = await createText("📢 announce");
    const chat = await createText("💬 chat");
    const staff = await createText("🛡 staff-room");
    const join = await createText("✋ join");
    const generalVC = await createVoice("🎤 General VC");
    const staffVC = await createVoice("🎤 Staff VC");

    const created = {
      categoryId: category.id,
      welcomeId: welcome.id,
      announceId: announce.id,
      chatId: chat.id,
      staffId: staff.id,
      joinId: join.id,
      generalVCId: generalVC.id,
      staffVCId: staffVC.id
    };

    this.channels[allianceId] = created;
    console.log(`Kanały dla sojuszu ${allianceTag} zostały utworzone.`);
    return created;
  }

  /** Pobiera ID kanału powitalnego */
  static getWelcomeChannel(allianceId: string): string | undefined {
    return this.channels[allianceId]?.welcomeId;
  }

  static getAnnounceChannel(allianceId: string): string | undefined {
    return this.channels[allianceId]?.announceId;
  }

  static getChatChannel(allianceId: string): string | undefined {
    return this.channels[allianceId]?.chatId;
  }

  static getStaffChannel(allianceId: string): string | undefined {
    return this.channels[allianceId]?.staffId;
  }

  static getJoinChannel(allianceId: string): string | undefined {
    return this.channels[allianceId]?.joinId;
  }

  static getGeneralVC(allianceId: string): string | undefined {
    return this.channels[allianceId]?.generalVCId;
  }

  static getStaffVC(allianceId: string): string | undefined {
    return this.channels[allianceId]?.staffVCId;
  }
}