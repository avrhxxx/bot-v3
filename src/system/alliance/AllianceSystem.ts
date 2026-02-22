import {
  Guild,
  ChannelType,
  PermissionFlagsBits,
  Role,
  CategoryChannel,
  TextChannel
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

    const createdRoles: Role[] = [];
    const createdChannels: (CategoryChannel | TextChannel)[] = [];

    try {
      // =====================
      // ROLES
      // =====================

      const r5 = await guild.roles.create({
        name: `${tag} R5`,
        mentionable: false
      });
      createdRoles.push(r5);

      const r4 = await guild.roles.create({
        name: `${tag} R4`,
        mentionable: false
      });
      createdRoles.push(r4);

      const r3 = await guild.roles.create({
        name: `${tag} R3`,
        mentionable: false
      });
      createdRoles.push(r3);

      const identity = await guild.roles.create({
        name: `[${tag}]`,
        mentionable: true
      });
      createdRoles.push(identity);

      // =====================
      // CATEGORY
      // =====================

      const category = await guild.channels.create({
        name: `Alliance • ${tag}`,
        type: ChannelType.GuildCategory
      }) as CategoryChannel;

      createdChannels.push(category);

      // =====================
      // CHANNELS
      // =====================

      const leadership = await guild.channels.create({
        name: "leadership",
        type: ChannelType.GuildText,
        parent: category.id
      }) as TextChannel;

      const officers = await guild.channels.create({
        name: "officers",
        type: ChannelType.GuildText,
        parent: category.id
      }) as TextChannel;

      const members = await guild.channels.create({
        name: "members",
        type: ChannelType.GuildText,
        parent: category.id
      }) as TextChannel;

      const join = await guild.channels.create({
        name: "join",
        type: ChannelType.GuildText,
        parent: category.id
      }) as TextChannel;

      createdChannels.push(leadership, officers, members, join);

      // =====================
      // PERMISSIONS
      // =====================

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

      // =====================
      // ASSIGN LEADER (R5 + Identity ONLY)
      // =====================

      const leader = await guild.members.fetch(leaderId);

      await leader.roles.add([
        r5.id,
        identity.id
      ]);

      // =====================
      // RETURN DOMAIN STRUCTURE
      // =====================

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

    } catch (error) {
      // =====================
      // ROLLBACK
      // =====================

      for (const channel of createdChannels) {
        try { await channel.delete(); } catch {}
      }

      for (const role of createdRoles) {
        try { await role.delete(); } catch {}
      }

      throw error;
    }
  }
}