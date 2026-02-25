/**
 * ============================================
 * MODULE: RoleModule
 * FILE: src/system/alliance/modules/role/RoleModule.ts
 * LAYER: SYSTEM (Alliance Role Module)
 * ============================================
 *
 * RESPONSIBILITY:
 * - Tworzenie ról R5, R4, R3 i identity
 * - Przypisywanie ról do członków
 * - Promocje i demacje członków (R3 -> R4 -> R5)
 * - Walidacja limitów ról w sojuszu
 * - HasRole helper
 *
 * DEPENDENCIES:
 * - AllianceService (pobranie danych sojuszu, audyt, liczenie członków)
 * - MutationGate (atomowość operacji)
 *
 * ============================================
 */

import { Guild, GuildMember } from "discord.js"; // discord.js types
import { MutationGate } from "../../../engine/MutationGate"; // atomic operations
import { AllianceService } from "../../AllianceService"; // alliance data / limits

// ----------------- INTERFACES -----------------
export interface AllianceRoles {
  r5RoleId: string;
  r4RoleId: string;
  r3RoleId: string;
  identityRoleId: string;
}

// Alias do przekazywania referencji członka w metodach
export type AllianceMemberRef = { userId: string; role: "R3" | "R4" | "R5" };

// ----------------- CONSTANTS -----------------
const MAX_MEMBERS = 100; // maksymalna liczba członków w sojuszu
const MAX_R4 = 10;       // maksymalna liczba ról R4

// ----------------- ROLE MODULE CLASS -----------------
export class RoleModule {

  // ----------------- CREATE ROLES -----------------
  static async createRoles(guild: Guild, tag: string): Promise<AllianceRoles> {
    const r5 = await guild.roles.create({ name: `${tag} R5`, mentionable: false });
    const r4 = await guild.roles.create({ name: `${tag} R4`, mentionable: false });
    const r3 = await guild.roles.create({ name: `${tag} R3`, mentionable: false });
    const identity = await guild.roles.create({ name: `[${tag}]`, mentionable: true });

    return { r5RoleId: r5.id, r4RoleId: r4.id, r3RoleId: r3.id, identityRoleId: identity.id };
  }

  // ----------------- ASSIGN ROLES -----------------
  static async assignLeaderRoles(member: GuildMember, roles: AllianceRoles) {
    await member.roles.add([roles.r5RoleId, roles.identityRoleId]);
  }

  static async assignRole(member: GuildMember | AllianceMemberRef, roleId: string) {
    await MutationGate.runAtomically(async () => {
      if ("userId" in member) {
        // stub: można dodać pobranie GuildMember z userId
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
        throw new Error("Member cannot be promoted, not in R3 or R4");
      }

      if (member.roles.cache.has(roles.r3RoleId)) {
        await member.roles.remove(roles.r3RoleId);
        await member.roles.add(roles.r4RoleId);
      } else if (member.roles.cache.has(roles.r4RoleId)) {
        if (r4Count >= MAX_R4) throw new Error("Limit R4 osiągnięty");
        await member.roles.remove(roles.r4RoleId);
        await member.roles.add(roles.r5RoleId);
      }

      if (totalMembers > MAX_MEMBERS) throw new Error("Limit członków przekroczony");
    });
  }

  // ----------------- DEMOTION -----------------
  static async demote(member: GuildMember, allianceId: string, roles: AllianceRoles) {
    await MutationGate.runAtomically(async () => {
      if (member.roles.cache.has(roles.r5RoleId)) {
        await member.roles.remove(roles.r5RoleId);
        await member.roles.add(roles.r4RoleId);
      } else if (member.roles.cache.has(roles.r4RoleId)) {
        await member.roles.remove(roles.r4RoleId);
        await member.roles.add(roles.r3RoleId);
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

    if (r4Count > MAX_R4) throw new Error("Limit R4 przekroczony");
    if (totalMembers > MAX_MEMBERS) throw new Error("Limit członków przekroczony");
  }
}