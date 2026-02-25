import { Guild, TextChannel, CategoryChannel, ChannelType, PermissionFlagsBits } from "discord.js";
import { AllianceService } from "../AllianceService";
import { RoleModule } from "../role/RoleModule";

export class ChannelModule {
  private static channels: Record<string, Record<string, string>> = {};

  // Tworzenie kanałów sojuszu
  static async createChannels(guild: Guild, allianceId: string, tag: string, name: string) {
    const alliance = AllianceService.getAllianceOrThrow(allianceId);
    const roles = alliance.roles;

    const createdChannels: Record<string, TextChannel> = {};

    // Liczba członków w sojuszu
    const memberCount = alliance.members.length;
    const categoryName = `${tag} | ${name} | ${memberCount}/100`;

    // Tworzenie kategorii
    const category = await guild.channels.create({ name: categoryName, type: ChannelType.GuildCategory }) as CategoryChannel;

    // ----------------- Tworzenie kanałów -----------------
    const welcome = await guild.channels.create({ name: "welcome", type: ChannelType.GuildText, parent: category.id }) as TextChannel;
    const announce = await guild.channels.create({ name: "announce", type: ChannelType.GuildText, parent: category.id }) as TextChannel;
    const chat = await guild.channels.create({ name: "chat", type: ChannelType.GuildText, parent: category.id }) as TextChannel;
    const staff = await guild.channels.create({ name: "staff-room", type: ChannelType.GuildText, parent: category.id }) as TextChannel;
    const join = await guild.channels.create({ name: "join", type: ChannelType.GuildText, parent: category.id }) as TextChannel;

    createdChannels["welcome"] = welcome;
    createdChannels["announce"] = announce;
    createdChannels["chat"] = chat;
    createdChannels["staff"] = staff;
    createdChannels["join"] = join;

    const everyoneId = guild.roles.everyone.id;

    // ----------------- Ustawienia permisji -----------------
    await welcome.permissionOverwrites.set([
      { id: everyoneId, deny: [PermissionFlagsBits.ViewChannel] },
      { id: roles.r3RoleId, allow: [PermissionFlagsBits.ViewChannel] },
      { id: roles.r4RoleId, allow: [PermissionFlagsBits.ViewChannel] },
      { id: roles.r5RoleId, allow: [PermissionFlagsBits.ViewChannel] },
    ]);

    await announce.permissionOverwrites.set([
      { id: everyoneId, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
      { id: roles.r3RoleId, allow: [PermissionFlagsBits.ViewChannel] },
      { id: roles.r4RoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
      { id: roles.r5RoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
    ]);

    await chat.permissionOverwrites.set([
      { id: everyoneId, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
      { id: roles.r3RoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
      { id: roles.r4RoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
      { id: roles.r5RoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
    ]);

    await staff.permissionOverwrites.set([
      { id: everyoneId, deny: [PermissionFlagsBits.ViewChannel] },
      { id: roles.r3RoleId, deny: [PermissionFlagsBits.ViewChannel] },
      { id: roles.r4RoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
      { id: roles.r5RoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
    ]);

    await join.permissionOverwrites.set([
      { id: everyoneId, allow: [PermissionFlagsBits.ViewChannel] },
      { id: roles.r3RoleId, deny: [PermissionFlagsBits.ViewChannel] },
      { id: roles.r4RoleId, deny: [PermissionFlagsBits.ViewChannel] },
      { id: roles.r5RoleId, deny: [PermissionFlagsBits.ViewChannel] },
    ]);

    this.channels[allianceId] = {
      categoryId: category.id,
      welcomeId: welcome.id,
      announceId: announce.id,
      chatId: chat.id,
      staffId: staff.id,
      joinId: join.id,
    };

    return this.channels[allianceId];
  }

  // ----------------- Aktualizacja licznika członków -----------------
  static async updateMemberCount(allianceId: string) {
    const alliance = AllianceService.getAllianceOrThrow(allianceId);
    const count = alliance.members.length;
    const channelIds = this.channels[allianceId];
    if (!channelIds) return;

    const guild = alliance.guild; // zakładamy, że alliance ma referencję do guild
    const category = guild.channels.cache.get(channelIds.categoryId) as CategoryChannel;
    if (!category) return;

    const newName = `${alliance.tag} | ${alliance.name} | ${count}/100`;
    if (category.name !== newName) {
      await category.setName(newName);
    }
  }

  // ----------------- GETTERY -----------------
  static getChannel(allianceId: string, type: keyof typeof ChannelModule["channels"][string]): string | undefined {
    return this.channels[allianceId]?.[type];
  }

  static getAnnounceChannel(allianceId: string) { return this.channels[allianceId]?.announceId; }
  static getWelcomeChannel(allianceId: string) { return this.channels[allianceId]?.welcomeId; }
  static getChatChannel(allianceId: string) { return this.channels[allianceId]?.chatId; }
  static getStaffChannel(allianceId: string) { return this.channels[allianceId]?.staffId; }
  static getJoinChannel(allianceId: string) { return this.channels[allianceId]?.joinId; }
}