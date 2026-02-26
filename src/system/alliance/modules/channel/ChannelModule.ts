import { Guild, TextChannel, CategoryChannel, VoiceChannel, ChannelType, PermissionFlagsBits, OverwriteResolvable } from "discord.js";
import { AllianceService } from "../AllianceService";

export class ChannelModule {
  // ----------------- IN-MEMORY CACHE -----------------
  private static channels: Record<string, Record<string, string>> = {};

  // ----------------- HELPER: GET ALL MEMBERS -----------------
  static getAllMembers(allianceId: string): { userId: string; roleId: string }[] {
    const alliance = AllianceService.getAllianceOrThrow(allianceId);
    const members: { userId: string; roleId: string }[] = [];

    if (alliance.members.r3) alliance.members.r3.forEach(u => members.push({ userId: u, roleId: alliance.roles.r3RoleId }));
    if (alliance.members.r4) alliance.members.r4.forEach(u => members.push({ userId: u, roleId: alliance.roles.r4RoleId }));
    if (alliance.members.r5) members.push({ userId: alliance.members.r5, roleId: alliance.roles.r5RoleId });

    return members;
  }

  // ----------------- HELPER: GENERATE PERMISSIONS -----------------
  private static generateOverwrites(guild: Guild, allianceRoles: Record<string, string>, config: Record<string, { view?: boolean; send?: boolean; connect?: boolean }>): OverwriteResolvable[] {
    const everyoneId = guild.roles.everyone.id;
    const overwrites: OverwriteResolvable[] = [];

    for (const [key, perms] of Object.entries(config)) {
      const roleId = key === "everyone" ? everyoneId : allianceRoles[key];
      const allow: bigint[] = [];
      const deny: bigint[] = [];

      if (perms.view !== undefined) perms.view ? allow.push(PermissionFlagsBits.ViewChannel) : deny.push(PermissionFlagsBits.ViewChannel);
      if (perms.send !== undefined) perms.send ? allow.push(PermissionFlagsBits.SendMessages) : deny.push(PermissionFlagsBits.SendMessages);
      if (perms.connect !== undefined) perms.connect ? allow.push(PermissionFlagsBits.Connect) : deny.push(PermissionFlagsBits.Connect);

      overwrites.push({ id: roleId, allow, deny });
    }

    return overwrites;
  }

  // ----------------- CREATE CHANNELS -----------------
  static async createChannels(guild: Guild, allianceId: string, tag: string, name: string) {
    const alliance = AllianceService.getAllianceOrThrow(allianceId);
    const memberCount = this.getAllMembers(allianceId).length;
    const categoryName = `🏰 ${tag} | ${name} | ${memberCount}/100`;

    const category = await guild.channels.create({ name: categoryName, type: ChannelType.GuildCategory }) as CategoryChannel;

    // ----------------- Tworzenie kanałów -----------------
    const channels = {
      welcome: await guild.channels.create({ name: "👋 welcome", type: ChannelType.GuildText, parent: category.id }) as TextChannel,
      announce: await guild.channels.create({ name: "📢 announce", type: ChannelType.GuildText, parent: category.id }) as TextChannel,
      chat: await guild.channels.create({ name: "💬 chat", type: ChannelType.GuildText, parent: category.id }) as TextChannel,
      staff: await guild.channels.create({ name: "🛡 staff-room", type: ChannelType.GuildText, parent: category.id }) as TextChannel,
      join: await guild.channels.create({ name: "✋ join", type: ChannelType.GuildText, parent: category.id }) as TextChannel,
      generalVC: await guild.channels.create({ name: "🎤 General VC", type: ChannelType.GuildVoice, parent: category.id }) as VoiceChannel,
      staffVC: await guild.channels.create({ name: "🎤 Staff VC", type: ChannelType.GuildVoice, parent: category.id }) as VoiceChannel,
    };

    // ----------------- PERMISSIONS CONFIG -----------------
    const permsConfig: Record<string, Record<string, { view?: boolean; send?: boolean; connect?: boolean }>> = {
      welcome: { everyone: { view: false }, r3RoleId: { view: true }, r4RoleId: { view: true }, r5RoleId: { view: true } },
      announce: { everyone: { view: false, send: false }, r3RoleId: { view: true, send: false }, r4RoleId: { view: true, send: true }, r5RoleId: { view: true, send: true } },
      chat: { everyone: { view: false, send: false }, r3RoleId: { view: true, send: true }, r4RoleId: { view: true, send: true }, r5RoleId: { view: true, send: true } },
      staff: { everyone: { view: false }, r3RoleId: { view: false }, r4RoleId: { view: true, send: true }, r5RoleId: { view: true, send: true } },
      join: { everyone: { view: true }, r3RoleId: { view: false }, r4RoleId: { view: false }, r5RoleId: { view: false } },
      generalVC: { everyone: { view: false, connect: false }, r3RoleId: { view: true, connect: true }, r4RoleId: { view: true, connect: true }, r5RoleId: { view: true, connect: true } },
      staffVC: { everyone: { view: false, connect: false }, r3RoleId: { view: false, connect: false }, r4RoleId: { view: true, connect: true }, r5RoleId: { view: true, connect: true } },
    };

    // ----------------- APPLY PERMISSIONS -----------------
    for (const [key, channel] of Object.entries(channels)) {
      const overwrites = this.generateOverwrites(guild, alliance.roles, permsConfig[key]);
      await channel.permissionOverwrites.set(overwrites);
    }

    // ----------------- CACHE -----------------
    this.channels[allianceId] = {
      categoryId: category.id,
      welcomeId: channels.welcome.id,
      announceId: channels.announce.id,
      chatId: channels.chat.id,
      staffId: channels.staff.id,
      joinId: channels.join.id,
      generalVCId: channels.generalVC.id,
      staffVCId: channels.staffVC.id,
    };

    return this.channels[allianceId];
  }

  // ----------------- UPDATE CATEGORY NAME (ONLY MODULE) -----------------
  static async updateCategoryName(guild: Guild, allianceId: string, tag?: string, name?: string) {
    const categoryId = this.channels[allianceId]?.categoryId;
    if (!categoryId) return;

    const alliance = AllianceService.getAllianceOrThrow(allianceId);
    const category = guild.channels.cache.get(categoryId) as CategoryChannel;
    if (!category) return;

    const memberCount = this.getAllMembers(allianceId).length;
    const categoryName = `🏰 ${tag || alliance.tag} | ${name || alliance.name} | ${memberCount}/100`;

    if (category.name !== categoryName) await category.setName(categoryName);
  }

  // ----------------- GETTERS -----------------
  static getChannel(allianceId: string, type: keyof typeof ChannelModule["channels"][string]): string | undefined {
    return this.channels[allianceId]?.[type];
  }

  static getAnnounceChannel(allianceId: string) { return this.channels[allianceId]?.announceId; }
  static getWelcomeChannel(allianceId: string) { return this.channels[allianceId]?.welcomeId; }
  static getChatChannel(allianceId: string) { return this.channels[allianceId]?.chatId; }
  static getStaffChannel(allianceId: string) { return this.channels[allianceId]?.staffId; }
  static getJoinChannel(allianceId: string) { return this.channels[allianceId]?.joinId; }
  static getGeneralVC(allianceId: string) { return this.channels[allianceId]?.generalVCId; }
  static getStaffVC(allianceId: string) { return this.channels[allianceId]?.staffVCId; }
}