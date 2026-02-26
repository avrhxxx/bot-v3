/**
 * ============================================
 * MODULE: RoleModule
 * FILE: src/system/alliance/modules/role/RoleModule.ts
 * LAYER: SYSTEM (Alliance Role Module)
 * ============================================
 *
 * RESPONSIBILITY:
 * - Creating roles R5, R4, R3, and identity
 * - Assigning roles to members
 * - Promoting/demoting members (R3 -> R4 -> R5)
 * - Validating role limits within alliance
 * - hasRole helper
 * - Broadcasting promotions/demotions
 *
 * DEPENDENCIES:
 * - AllianceService (fetch alliance data, audit, member counts)
 * - MutationGate (atomic operations)
 * - BroadcastModule (event broadcasting)
 *
 * ============================================
 */

import { Guild, GuildMember } from "discord.js";
import { MutationGate } from "../../../engine/MutationGate";
import { AllianceService } from "../../AllianceService";
import { BroadcastModule } from "../broadcast/BroadcastModule";

// ----------------- INTERFACES -----------------
export interface AllianceRoles {
  r5RoleId: string;
  r4RoleId: string;
  r3RoleId: string;
  identityRoleId: string;
}

export type AllianceMemberRef = { userId: string; role: "R3" | "R4" | "R5" };

// ----------------- CONSTANTS -----------------
const MAX_MEMBERS = 100;
const MAX_R4 = 10;

// ----------------- ROLE MODULE -----------------
export class RoleModule {

  // ----------------- CREATE ROLES -----------------
  static async createRoles(guild: Guild, allianceName: string): Promise<AllianceRoles> {
    const r5 = await guild.roles.create({ name: `R5${allianceName}`, mentionable: false });
    const r4 = await guild.roles.create({ name: `R4${allianceName}`, mentionable: false });
    const r3 = await guild.roles.create({ name: `R3${allianceName}`, mentionable: false });
    const identity = await guild.roles.create({ name: allianceName, mentionable: true });

    return { r5RoleId: r5.id, r4RoleId: r4.id, r3RoleId: r3.id, identityRoleId: identity.id };
  }

  // ----------------- ASSIGN ROLES -----------------
  static async assignLeaderRoles(member: GuildMember, roles: AllianceRoles) {
    await member.roles.add([roles.r5RoleId, roles.identityRoleId]);
  }

  static async assignRole(member: GuildMember | AllianceMemberRef, roleId: string) {
    await MutationGate.runAtomically(async () => {
      if ("userId" in member) {
        const guildMember = await AllianceService.fetchGuildMemberById(member.userId);
        if (guildMember) await guildMember.roles.add(roleId);
        return;
      }
      await member.roles.add(roleId);
    });
  }

  // ----------------- PROMOTION -----------------
  static async promote(member: GuildMember, allianceId: string, roles: AllianceRoles) {
    await MutationGate.runAtomically(async () => {
      const r4Count = await AllianceService.getR4Count(allianceId);
      const totalMembers = await AllianceService.getTotalMembersByAlliance(allianceId);

      if (!member.roles.cache.has(roles.r3RoleId) && !member.roles.cache.has(roles.r4RoleId)) {
        throw new Error("Member cannot be promoted: not in R3 or R4");
      }

      if (member.roles.cache.has(roles.r3RoleId)) {
        await member.roles.remove(roles.r3RoleId);
        await member.roles.add(roles.r4RoleId);
        await BroadcastModule.announcePromotion(allianceId, member.id, "R4", [roles.identityRoleId]);
      } else if (member.roles.cache.has(roles.r4RoleId)) {
        if (r4Count >= MAX_R4) throw new Error("Cannot promote: R4 role limit reached");
        await member.roles.remove(roles.r4RoleId);
        await member.roles.add(roles.r5RoleId);
        await BroadcastModule.announcePromotion(allianceId, member.id, "R5", [roles.identityRoleId]);
      }

      if (totalMembers > MAX_MEMBERS) throw new Error("Cannot promote: total alliance member limit exceeded");
    });
  }

  // ----------------- DEMOTION -----------------
  static async demote(member: GuildMember, allianceId: string, roles: AllianceRoles) {
    await MutationGate.runAtomically(async () => {
      if (member.roles.cache.has(roles.r5RoleId)) {
        await member.roles.remove(roles.r5RoleId);
        await member.roles.add(roles.r4RoleId);
        await BroadcastModule.announceDemotion(allianceId, member.id, "R4", [roles.identityRoleId]);
      } else if (member.roles.cache.has(roles.r4RoleId)) {
        await member.roles.remove(roles.r4RoleId);
        await member.roles.add(roles.r3RoleId);
        await BroadcastModule.announceDemotion(allianceId, member.id, "R3", [roles.identityRoleId]);
      }
    });
  }

  // ----------------- VALIDATION -----------------
  static hasRole(member: GuildMember, roleId: string): boolean {
    return member.roles.cache.has(roleId);
  }

  static async validateRoles(allianceId: string, roles: AllianceRoles) {
    const r4Count = await AllianceService.getR4Count(allianceId);
    const totalMembers = await AllianceService.getTotalMembersByAlliance(allianceId);

    if (r4Count > MAX_R4) throw new Error("R4 role limit exceeded");
    if (totalMembers > MAX_MEMBERS) throw new Error("Total alliance member limit exceeded");
  }
}