// File path: src/system/alliance/AllianceSystem.ts

import {
  Guild,
  ChannelType,
  PermissionFlagsBits,
  Role,
  CategoryChannel,
  TextChannel
} from "discord.js";

// Poprawiony import typów z nowego folderu system/alliance
import { AllianceRoles, AllianceChannels } from "./AllianceTypes";

export class AllianceSystem {

  /**
   * Creates roles and channels for a new alliance.
   */
  static async createInfrastructure(params: {
    guild: Guild;
    tag: string;
    leaderId: string;
  }): Promise<{ roles: AllianceRoles; channels: AllianceChannels }> {

    const { guild, tag, leaderId } = params;

    const createdRoles: Role[] = [];
    const createdChannels: (CategoryChannel | TextChannel)[] = [];

    try {
      // ROLES
      const r5 = await guild.roles.create({ name: `${tag} R5`, mentionable: false });
      const r4 = await guild.roles.create({ name: `${tag} R4`, mentionable: false });
      const r3 = await guild.roles.create({ name: `${tag} R3`, mentionable: false });
      const identity = await guild.roles.create({ name: `[${tag}]`, mentionable: true });

      createdRoles.push(r5, r4, r3, identity);

      // CATEGORY
      const category = await guild.channels.create({
        name: `Alliance • ${tag}`,
        type: ChannelType.GuildCategory
      }) as CategoryChannel;

      createdChannels.push(category);

      // CHANNELS
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

      // PERMISSIONS
      const everyoneId = guild.roles.everyone.id;

      await leadership.permissionOverwrites.set([
        { id: everyoneId, deny: [PermissionFlagsBits.ViewChannel] },
        { id: r5.id, allow: [PermissionFlagsBits.ViewChannel] }
      ]);

      await officers.permissionOverwrites.set([
        { id: everyoneId, deny: [PermissionFlagsBits.ViewChannel] },
        { id: r5.id, allow: [PermissionFlagsBits.ViewChannel] },
        { id: r4.id, allow: [PermissionFlagsBits.ViewChannel] }
      ]);

      await members.permissionOverwrites.set([
        { id: everyoneId, deny: [PermissionFlagsBits.ViewChannel] },
        { id: r5.id, allow: [PermissionFlagsBits.ViewChannel] },
        { id: r4.id, allow: [PermissionFlagsBits.ViewChannel] },
        { id: r3.id, allow: [PermissionFlagsBits.ViewChannel] }
      ]);

      await join.permissionOverwrites.set([
        { id: everyoneId, allow: [PermissionFlagsBits.ViewChannel] }
      ]);

      // ASSIGN LEADER
      const leader = await guild.members.fetch(leaderId);
      await leader.roles.add([r5.id, identity.id]);

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
      for (const ch of createdChannels) { try { await ch.delete(); } catch {} }
      for (const rl of createdRoles) { try { await rl.delete(); } catch {} }
      throw error;
    }
  }

  // =========================================================
  // TEMPORARY STUB METHODS (to fix build)
  // =========================================================

  static async updateTag(): Promise<void> { throw new Error("Not implemented yet"); }
  static async updateName(): Promise<void> { throw new Error("Not implemented yet"); }
  static async joinAlliance(): Promise<void> { throw new Error("Not implemented yet"); }
  static async leaveAlliance(): Promise<void> { throw new Error("Not implemented yet"); }
  static async promoteMember(): Promise<void> { throw new Error("Not implemented yet"); }
  static async demoteMember(): Promise<void> { throw new Error("Not implemented yet"); }
  static async kickMember(): Promise<void> { throw new Error("Not implemented yet"); }
  static async transferLeader(): Promise<void> { throw new Error("Not implemented yet"); }
  static async setLeaderSystem(): Promise<void> { throw new Error("Not implemented yet"); }
  static async deleteInfrastructure(): Promise<void> { throw new Error("Not implemented yet"); }

}