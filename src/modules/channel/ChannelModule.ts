import {
  Guild,
  TextChannel,
  VoiceChannel,
  CategoryChannel,
  ChannelType
} from "discord.js";

export class ChannelModule {
  // Pamiętanie ID stworzonych kanałów
  private static channels: Record<string, Record<string, string>> = {};

  // Tworzenie kategorii i kanałów dla sojuszu
  static async createChannels(guild: Guild, allianceName: string) {
    if (this.channels[allianceName]) {
      throw new Error("Kanały dla tego sojuszu już istnieją");
    }

    // Tworzymy kategorię z nazwą sojuszu
    const category = await guild.channels.create({
      name: allianceName,
      type: ChannelType.GuildCategory
    }) as CategoryChannel;

    // Tworzymy kanały wewnątrz kategorii
    const created = await this.createChildChannels(guild, category);

    // Zapamiętujemy ID kanałów
    this.channels[allianceName] = { categoryId: category.id, ...created };

    return this.channels[allianceName];
  }

  // ----------------- INTERNAL: CREATE CHILD CHANNELS -----------------
  private static async createChildChannels(guild: Guild, category: CategoryChannel) {
    const base = async (name: string, type: ChannelType) =>
      guild.channels.create({ name, type, parent: category.id });

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

  // ----------------- GETTERY -----------------
  static getCategoryId(allianceName: string): string | undefined {
    return this.channels[allianceName]?.categoryId;
  }

  static getWelcomeChannel(allianceName: string): string | undefined {
    return this.channels[allianceName]?.welcomeId;
  }

  static getAnnounceChannel(allianceName: string): string | undefined {
    return this.channels[allianceName]?.announceId;
  }

  static getChatChannel(allianceName: string): string | undefined {
    return this.channels[allianceName]?.chatId;
  }

  static getStaffChannel(allianceName: string): string | undefined {
    return this.channels[allianceName]?.staffId;
  }

  static getJoinChannel(allianceName: string): string | undefined {
    return this.channels[allianceName]?.joinId;
  }

  static getGeneralVC(allianceName: string): string | undefined {
    return this.channels[allianceName]?.generalVCId;
  }

  static getStaffVC(allianceName: string): string | undefined {
    return this.channels[allianceName]?.staffVCId;
  }
}