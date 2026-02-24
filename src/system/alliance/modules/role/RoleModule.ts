/**
 * ============================================
 * FILE: src/system/alliance/RoleModule/RoleModule.ts
 * LAYER: SYSTEM (Alliance Role Management Module)
 * ============================================
 *
 * MODUŁ RÓL W SOJUSZU
 *
 * ODPOWIEDZIALNOŚĆ:
 * - Tworzenie i zarządzanie rolami Discord (R3/R4/R5 + identity)
 * - Promocja i degradacja członków
 * - Walidacja limitów ról i spójności sojuszu
 *
 * ZALEŻNOŚCI:
 * - AllianceService (pobranie sojuszu, audyt)
 * - MutationGate (atomiczne operacje)
 *
 * UWAGA ARCHITEKTONICZNA:
 * - Wszystkie mutacje w MutationGate.runAtomically
 * - Role są zgodne z AllianceTypes
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

const MAX_R4 = 10;
const MAX_MEMBERS = 100;

export class RoleModule {

  // ----------------- CREATE ROLES -----------------
  static async createRoles(guild: Guild, tag: string): Promise<AllianceRoles> {
    // fillpatch: tworzenie ról w Discord
    const r5 = await guild.roles.create({ name: `${tag} R5`, mentionable: false });
    const r4 = await guild.roles.create({ name: `${tag} R4`, mentionable: false });
    const r3 = await guild.roles.create({ name: `${tag} R3`, mentionable: false });
    const identity = await guild.roles.create({ name: `[${tag}]`, mentionable: true });

    return {
      r5RoleId: r5.id,
      r4RoleId: r4.id,
      r3RoleId: r3.id,
      identityRoleId: identity.id
    };
  }

  // ----------------- ASSIGN ROLES -----------------
  static async assignLeaderRoles(member: GuildMember, roles: AllianceRoles) {
    // fillpatch: przypisanie lidera (R5 + identity)
    await member.roles.add([roles.r5RoleId, roles.identityRoleId]);
  }

  static async assignRole(member: GuildMember, roleId: string) {
    // fillpatch: atomowe przypisanie dowolnej roli
    await MutationGate.runAtomically(async () => {
      await member.roles.add(roleId);
    });
  }

  // ----------------- PROMOTION -----------------
  static async promote(member: GuildMember, roles: AllianceRoles) {
    await MutationGate.runAtomically(async () => {
      // fillpatch: walidacja aktualnej roli
      const hasR3 = member.roles.cache.has(roles.r3RoleId);
      const hasR4 = member.roles.cache.has(roles.r4RoleId);

      if (!hasR3 && !hasR4) throw new Error("Member nie posiada roli R3 ani R4, nie można promować");

      if (hasR3) {
        await member.roles.remove(roles.r3RoleId);
        await member.roles.add(roles.r4RoleId);
      } else if (hasR4) {
        const r4Count = await AllianceService.getR4Count(member.guild.id);
        if (r4Count >= MAX_R4) throw new Error("Limit R4 osiągnięty");
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

  // ----------------- VALIDATION -----------------
  static async validateRoles(allianceId: string, roles: AllianceRoles) {
    // fillpatch: walidacja limitów R4 i całkowitych członków
    const r4Count = await AllianceService.getR4Count(allianceId);
    const totalMembers = await AllianceService.getTotalMembersByAlliance(allianceId);

    if (r4Count > MAX_R4) throw new Error("Limit R4 przekroczony");
    if (totalMembers > MAX_MEMBERS) throw new Error("Limit członków przekroczony");
  }

  // ----------------- HELPERS -----------------
  static hasRole(member: GuildMember, roleId: string): boolean {
    // fillpatch: sprawdzenie czy członek ma daną rolę
    return member.roles.cache.has(roleId);
  }
}