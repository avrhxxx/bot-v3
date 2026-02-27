import { Guild, TextChannel, VoiceChannel, CategoryChannel, ChannelType } from "discord.js";

export class ChannelModule {
  private static channels: Record<string, Record<string, string>> = {};

  // ----------------- CREATE CHANNELS -----------------
  static async createChannels(guild: Guild, allianceId: string, tag: string, name: string) {
    if (this.channels[allianceId]) return this.channels[allianceId];

    // Tworzymy kategorię sojuszu
    const category = await guild.channels.create({
      name: name, // tylko nazwa sojuszu
      type: ChannelType.GuildCategory
    }) as CategoryChannel;

    // Tworzymy kilka prostych kanałów w tej kategorii
    const welcome = await guild.channels.create({
      name: "👋 welcome",
      type: ChannelType.GuildText,
      parent: category.id
    }) as TextChannel;

    const chat = await guild.channels.create({
      name: "💬 chat",
      type: ChannelType.GuildText,
      parent: category.id
    }) as TextChannel;

    const generalVC = await guild.channels.create({
      name: "🎤 General VC",
      type: ChannelType.GuildVoice,
      parent: category.id
    }) as VoiceChannel;

    const staffVC = await guild.channels.create({
      name: "🎤 Staff VC",
      type: ChannelType.GuildVoice,
      parent: category.id
    }) as VoiceChannel;

    const result = {
      categoryId: category.id,
      welcomeId: welcome.id,
      chatId: chat.id,
      generalVCId: generalVC.id,
      staffVCId: staffVC.id
    };

    this.channels[allianceId] = result;
    return result;
  }

  // ----------------- GETTER CHANNELS -----------------
  static getWelcomeChannel(allianceId: string) {
    return this.channels[allianceId]?.welcomeId;
  }

  static getChatChannel(allianceId: string) {
    return this.channels[allianceId]?.chatId;
  }

  static getGeneralVC(allianceId: string) {
    return this.channels[allianceId]?.generalVCId;
  }

  static getStaffVC(allianceId: string) {
    return this.channels[allianceId]?.staffVCId;
  }
}