import { Guild, CategoryChannel, TextChannel, ChannelType, PermissionFlagsBits } from "discord.js";
import { AllianceRoles } from "../RoleModule/RoleModule";

export interface AllianceChannels {
  categoryId: string;
  leadershipChannelId: string;
  officersChannelId: string;
  membersChannelId: string;
  joinChannelId: string;
}

export class ChannelModule {
  /**
   * Tworzy strukturę kanałów sojuszu i ustawia uprawnienia dla ról
   */
  static async createChannels(guild: Guild, tag: string, roles: AllianceRoles): Promise<AllianceChannels> {
    const createdChannels: (CategoryChannel | TextChannel)[] = [];

    // Kategoria
    const category = await guild.channels.create({
      name: `Alliance • ${tag}`,
      type: ChannelType.GuildCategory
    }) as CategoryChannel;
    createdChannels.push(category);

    // Kanały
    const leadership = await guild.channels.create({ name: "leadership", type: ChannelType.GuildText, parent: category.id }) as TextChannel;
    const officers = await guild.channels.create({ name: "officers", type: ChannelType.GuildText, parent: category.id }) as TextChannel;
    const members = await guild.channels.create({ name: "members", type: ChannelType.GuildText, parent: category.id }) as TextChannel;
    const join = await guild.channels.create({ name: "join", type: ChannelType.GuildText, parent: category.id }) as TextChannel;

    createdChannels.push(leadership, officers, members, join);

    // Uprawnienia
    const everyoneId = guild.roles.everyone.id;

    await leadership.permissionOverwrites.set([
      { id: everyoneId, deny: [PermissionFlagsBits.ViewChannel] },
      { id: roles.r5RoleId, allow: [PermissionFlagsBits.ViewChannel] }
    ]);

    await officers.permissionOverwrites.set([
      { id: everyoneId, deny: [PermissionFlagsBits.ViewChannel] },
      { id: roles.r5RoleId, allow: [PermissionFlagsBits.ViewChannel] },
      { id: roles.r4RoleId, allow: [PermissionFlagsBits.ViewChannel] }
    ]);

    await members.permissionOverwrites.set([
      { id: everyoneId, deny: [PermissionFlagsBits.ViewChannel] },
      { id: roles.r5RoleId, allow: [PermissionFlagsBits.ViewChannel] },
      { id: roles.r4RoleId, allow: [PermissionFlagsBits.ViewChannel] },
      { id: roles.r3RoleId, allow: [PermissionFlagsBits.ViewChannel] }
    ]);

    await join.permissionOverwrites.set([
      { id: everyoneId, allow: [PermissionFlagsBits.ViewChannel] }
    ]);

    return {
      categoryId: category.id,
      leadershipChannelId: leadership.id,
      officersChannelId: officers.id,
      membersChannelId: members.id,
      joinChannelId: join.id
    };
  }
}