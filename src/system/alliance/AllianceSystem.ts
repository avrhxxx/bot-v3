// =========================================================
// File path: src/system/alliance/AllianceSystem.ts
// =========================================================

import {
  Guild,
  ChannelType,
  PermissionFlagsBits,
  Role,
  CategoryChannel,
  TextChannel
} from "discord.js";

import { AllianceRoles, AllianceChannels } from "./AllianceTypes";

/**
 * AllianceSystem
 * ---------------------------------------------------------
 * Główny system infrastruktury sojuszy.
 *
 * Odpowiada za:
 * - tworzenie ról i kanałów
 * - przypisywanie lidera
 * - (docelowo) zarządzanie członkami i rangami
 *
 * Aktualnie część metod to STUBY,
 * aby build nie wywalał błędów przy wywołaniach z komend.
 */
export class AllianceSystem {

  /**
   * Tworzy pełną infrastrukturę nowego sojuszu:
   * - role (R5, R4, R3, Identity)
   * - kategorię
   * - kanały (leadership, officers, members, join)
   * - ustawia permission overwrites
   * - przypisuje liderowi rolę R5 i Identity
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
      // =====================================================
      // ROLES
      // =====================================================

      const r5 = await guild.roles.create({ name: `${tag} R5`, mentionable: false });
      const r4 = await guild.roles.create({ name: `${tag} R4`, mentionable: false });
      const r3 = await guild.roles.create({ name: `${tag} R3`, mentionable: false });
      const identity = await guild.roles.create({ name: `[${tag}]`, mentionable: true });

      createdRoles.push(r5, r4, r3, identity);

      // =====================================================
      // CATEGORY
      // =====================================================

      const category = await guild.channels.create({
        name: `Alliance • ${tag}`,
        type: ChannelType.GuildCategory
      }) as CategoryChannel;

      createdChannels.push(category);

      // =====================================================
      // CHANNELS
      // =====================================================

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

      // =====================================================
      // PERMISSIONS
      // =====================================================

      const everyoneId = guild.roles.everyone.id;

      // Leadership – tylko R5
      await leadership.permissionOverwrites.set([
        { id: everyoneId, deny: [PermissionFlagsBits.ViewChannel] },
        { id: r5.id, allow: [PermissionFlagsBits.ViewChannel] }
      ]);

      // Officers – R5 + R4
      await officers.permissionOverwrites.set([
        { id: everyoneId, deny: [PermissionFlagsBits.ViewChannel] },
        { id: r5.id, allow: [PermissionFlagsBits.ViewChannel] },
        { id: r4.id, allow: [PermissionFlagsBits.ViewChannel] }
      ]);

      // Members – R5 + R4 + R3
      await members.permissionOverwrites.set([
        { id: everyoneId, deny: [PermissionFlagsBits.ViewChannel] },
        { id: r5.id, allow: [PermissionFlagsBits.ViewChannel] },
        { id: r4.id, allow: [PermissionFlagsBits.ViewChannel] },
        { id: r3.id, allow: [PermissionFlagsBits.ViewChannel] }
      ]);

      // Join – publiczny
      await join.permissionOverwrites.set([
        { id: everyoneId, allow: [PermissionFlagsBits.ViewChannel] }
      ]);

      // =====================================================
      // ASSIGN LEADER
      // =====================================================

      const leader = await guild.members.fetch(leaderId);
      await leader.roles.add([r5.id, identity.id]);

      // =====================================================
      // RETURN INFRASTRUCTURE IDS
      // =====================================================

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

      // =====================================================
      // ROLLBACK (jeśli coś się wywali)
      // =====================================================

      for (const ch of createdChannels) { try { await ch.delete(); } catch {} }
      for (const rl of createdRoles) { try { await rl.delete(); } catch {} }

      throw error;
    }
  }

  // =========================================================
  // STUB METHODS
  // ---------------------------------------------------------
  // Tymczasowe metody, aby:
  // - komendy mogły je wywoływać
  // - TypeScript nie zgłaszał błędów braku metody
  // - build NIE wywalał się na Railway
  //
  // Docelowo zostaną zastąpione prawdziwą logiką.
  // =========================================================

  static async updateTag(actorId?: string, guildId?: string, newTag?: string) {
    console.log(`[STUB] updateTag called: actor=${actorId}, guild=${guildId}, newTag=${newTag}`);
  }

  static async updateName(actorId?: string, guildId?: string, newName?: string) {
    console.log(`[STUB] updateName called: actor=${actorId}, guild=${guildId}, newName=${newName}`);
  }

  static async joinAlliance(userId?: string, guildId?: string) {
    console.log(`[STUB] joinAlliance called: user=${userId}, guild=${guildId}`);
  }

  static async leaveAlliance(userId?: string, guildId?: string) {
    console.log(`[STUB] leaveAlliance called: user=${userId}, guild=${guildId}`);
    return { tag: "DUMMY_TAG" };
  }

  static async promoteMember(actorId?: string, targetUserId?: string, guildId?: string) {
    console.log(`[STUB] promoteMember called: actor=${actorId}, target=${targetUserId}, guild=${guildId}`);
    return { newRank: "R4" };
  }

  static async demoteMember(actorId?: string, targetUserId?: string, guildId?: string) {
    console.log(`[STUB] demoteMember called: actor=${actorId}, target=${targetUserId}, guild=${guildId}`);
    return { newRank: "R3" };
  }

  static async kickMember(actorId?: string, targetUserId?: string, guildId?: string) {
    console.log(`[STUB] kickMember called: actor=${actorId}, target=${targetUserId}, guild=${guildId}`);
    return { success: true };
  }

  static async transferLeader(alliance?: any, newLeaderId?: string) {
    console.log(`[STUB] transferLeader called: alliance=${alliance?.tag}, newLeader=${newLeaderId}`);
  }

  static async setLeaderSystem(alliance?: any, newLeaderId?: string) {
    console.log(`[STUB] setLeaderSystem called: alliance=${alliance?.tag}, newLeader=${newLeaderId}`);
  }

  static async deleteInfrastructure(alliance?: any) {
    console.log(`[STUB] deleteInfrastructure called: alliance=${alliance?.tag}`);
  }

  // =========================================================
  // HELPER GETTERS (STUB)
  // =========================================================

  static async getAllianceByMember(memberId?: string) {
    console.log(`[STUB] getAllianceByMember called: member=${memberId}`);
    return {
      id: "dummyAlliance",
      tag: "DUM",
      members: { r5: [memberId], r4: [], r3: [] }
    };
  }

  static async getAllianceByTagOrName(identifier?: string) {
    console.log(`[STUB] getAllianceByTagOrName called: identifier=${identifier}`);
    return { id: "dummyAlliance", tag: "DUM" };
  }

  static isLeader(alliance?: any, userId?: string) {
    console.log(`[STUB] isLeader called: alliance=${alliance?.tag}, user=${userId}`);
    return true;
  }

  static isMember(alliance?: any, userId?: string) {
    console.log(`[STUB] isMember called: alliance=${alliance?.tag}, user=${userId}`);
    return true;
  }

}