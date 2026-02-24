/**
 * ============================================
 * FILE: src/system/alliance/RoleModule/RoleModule.ts
 * LAYER: SYSTEM (Alliance Role Management Module)
 * ============================================
 *
 * ODPOWIEDZIALNOŚĆ:
 * - Tworzenie i zarządzanie rolami sojuszu na Discord
 * - Promocja i degradacja członków
 * - Walidacja limitów R4 i członków całkowitych
 *
 * ZALEŻNOŚCI:
 * - AllianceService (dane sojuszu, liczenie członków)
 * - MutationGate (atomiczne operacje Discord)
 *
 * UWAGA:
 * - Wszystkie operacje mutacyjne wykonywane w MutationGate.runAtomically
 * - Zachowanie spójności z AllianceService i MembershipModule
 *
 * ============================================
 */

import { Guild, GuildMember } from "discord.js";
import { MutationGate } from "../../engine/MutationGate";
import { AllianceService } from "../AllianceService";

export interface AllianceRoles {
  r5RoleId: string;
  r4RoleId: string;
  r3RoleId: string;
  identityRoleId: string;
}

const MAX_MEMBERS = 100;
const MAX_R4 = 10;

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

  static async assignRole(member: GuildMember, roleId: string) {
    await MutationGate.runAtomically(async () => {
      await member.roles.add(roleId);
    });
  }

  // ----------------- PROMOTION -----------------
  static async promote(member: GuildMember, roles: AllianceRoles) {
    await MutationGate.runAtomically(async () => {
      if (!member.roles.cache.has(roles.r3RoleId) && !member.roles.cache.has(roles.r4RoleId)) {
        throw new Error("Member cannot be promoted, not in R3 or R4");
      }

      if (member.roles.cache.has(roles.r3RoleId)) {
        await member.roles.remove(roles.r3RoleId);
        await member.roles.add(roles.r4RoleId);
      } else if (member.roles.cache.has(roles.r4RoleId)) {
        // Sprawdzenie limitu R4
        const r4Count = await AllianceService.getR4Count(member.guild.id);
        if (r4Count >= MAX_R4) {
          throw new Error("Limit R4 osiągnięty");
        }
        await member.roles.remove(roles.r4RoleId);
        await member.roles.add(roles.r5RoleId);
      }
    });
  }

  // ----------------- DEMOTION -----------------
  static async demote(member: GuildMember, roles: AllianceRoles) {
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

  // ----------------- VALIDATION / CHECKS -----------------
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