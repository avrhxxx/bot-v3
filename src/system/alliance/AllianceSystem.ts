import {
  Guild,
  CategoryChannel,
  Role,
  ChannelType,
  PermissionFlagsBits
} from "discord.js";
import { AllianceRoles, AllianceChannels } from "../../features/alliance/AllianceTypes";

export class AllianceSystem {
  static async createInfrastructure(params: {
    guild: Guild;
    tag: string;
    leaderId: string;
  }): Promise<{
    roles: AllianceRoles;
    channels: AllianceChannels;
  }> {
    const { guild, tag, leaderId } = params;

    // ===== ROLES =====

    const r5 = await guild.roles.create({
      name: `${tag} R5`,
      mentionable: false
    });

    const r4 = await guild.roles.create({
      name: `${tag} R4`,
      mentionable: false
    });

    const r3 = await guild.roles.create({
      name: `${tag} R3`,
      mentionable: false
    });

    const identity = await guild.roles.create({
      name: `[${tag}]`,
      mentionable: true
    });

    // ===== CATEGORY =====

    const category = await guild.channels.create({
      name: `Alliance • ${tag}`,
      type: ChannelType.GuildCategory
    });

    // ===== CHANNELS =====

    const leadership = await guild.channels.create({
      name: "leadership",
      type: ChannelType.GuildText,
      parent: category.id
    });

    const officers = await guild.channels.create({
      name: "officers",
      type: ChannelType.GuildText,
      parent: category.id
    });

    const members = await guild.channels.create({
      name: "members",
      type: ChannelType.GuildText,
      parent: category.id
    });

    const join = await guild.channels.create({
      name: "join",
      type: ChannelType.GuildText,
      parent: category.id
    });

    // ===== PERMISSIONS =====

    await leadership.permissionOverwrites.set([
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel]
      },
      {
        id: r5.id,
        allow: [PermissionFlagsBits.ViewChannel]
      }
    ]);

    await officers.permissionOverwrites.set([
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel]
      },
      {
        id: r5.id,
        allow: [PermissionFlagsBits.ViewChannel]
      },
      {
        id: r4.id,
        allow: [PermissionFlagsBits.ViewChannel]
      }
    ]);

    await members.permissionOverwrites.set([
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel]
      },
      {
        id: r5.id,
        allow: [PermissionFlagsBits.ViewChannel]
      },
      {
        id: r4.id,
        allow: [PermissionFlagsBits.ViewChannel]
      },
      {
        id: r3.id,
        allow: [PermissionFlagsBits.ViewChannel]
      }
    ]);

    await join.permissionOverwrites.set([
      {
        id: guild.roles.everyone.id,
        allow: [PermissionFlagsBits.ViewChannel]
      }
    ]);

    // ===== ASSIGN LEADER =====

    const leader = await guild.members.fetch(leaderId);

    await leader.roles.add([
      r5.id,
      r3.id,
      identity.id
    ]);

    return {
      roles: {
        r5RoleId: r5.id,
        r4RoleId: r4.id,
        r3RoleId: r3.id,
        identityRoleId: identity.id
      },
      channels: {
        categoryId: category.id,
        leadershipChannelId: leadership.id,
        officersChannelId: officers.id,
        membersChannelId: members.id,
        joinChannelId: join.id
      }
    };
  }
}