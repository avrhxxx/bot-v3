/**
 * ==========================================================
 * 📁 src/system/alliance/modules/role/RoleModule.ts
 * MODULE: RoleModule
 * LAYER: SYSTEM (Alliance Role Management)
 * ==========================================================
 *
 * RESPONSIBILITY:
 * - Tworzenie i przypisywanie ról Discord dla sojuszu
 * - Operacje promocji i degradacji członków
 * - Atomiczne mutacje za pomocą MutationGate
 *
 * DEPENDENCIES:
 * - discord.js (Guild, GuildMember)
 * - MutationGate (atomiczne mutacje)
 * - AllianceManager (dostęp do danych sojuszu, w razie potrzeby)
 */

import { Guild, GuildMember } from "discord.js";
import { MutationGate } from "../../../engine/MutationGate";
import { AllianceManager } from "../../AllianceManager";

/** Typ ID ról Discord dla sojuszu */
export interface AllianceRoles {
  r5RoleId: string;
  r4RoleId: string;
  r3RoleId: string;
  identityRoleId: string;
}

/** Moduł odpowiedzialny za zarządzanie rolami członków sojuszu */
export class RoleModule {

  /**
   * Tworzy wszystkie role sojuszu na serwerze Discord
   * @param guild - obiekt Discord Guild
   * @param allianceId - ID sojuszu (opcjonalnie do logiki)
   * @param tag - tag sojuszu używany w nazwach ról
   * @returns obiekt z ID ról
   */
  static async createRoles(
    guild: Guild,
    allianceId: string,
    tag: string
  ): Promise<AllianceRoles> {
    const r5 = await guild.roles.create({ name: `R5-${tag}`, mentionable: false });
    const r4 = await guild.roles.create({ name: `R4-${tag}`, mentionable: false });
    const r3 = await guild.roles.create({ name: `R3-${tag}`, mentionable: false });
    const identity = await guild.roles.create({ name: `${tag}`, mentionable: true });

    return {
      r5RoleId: r5.id,
      r4RoleId: r4.id,
      r3RoleId: r3.id,
      identityRoleId: identity.id
    };
  }

  /**
   * Przypisuje role lidera (R5 + identity) do członka
   * @param member - obiekt Discord GuildMember
   * @param roles - obiekt ID ról
   */
  static async assignLeaderRoles(member: GuildMember, roles: AllianceRoles) {
    await member.roles.add([roles.r5RoleId, roles.identityRoleId]);
  }

  /**
   * Przypisuje rolę R4 do członka
   * @param member - obiekt Discord GuildMember
   * @param roles - obiekt ID ról
   */
  static async assignR4Roles(member: GuildMember, roles: AllianceRoles) {
    await member.roles.add(roles.r4RoleId);
  }

  /**
   * Przypisuje pojedynczą rolę do członka w kontekście atomicznym
   * @param member - obiekt Discord GuildMember
   * @param roleId - ID roli do przypisania
   */
  static async assignRole(member: GuildMember, roleId: string) {
    await MutationGate.runAtomically(async () => {
      await member.roles.add(roleId);
    });
  }

  /**
   * Promuje członka: usuwa starą rolę (jeśli podana) i dodaje nową
   * @param member - obiekt Discord GuildMember
   * @param newRoleId - ID roli docelowej
   * @param oldRoleId - ID roli do usunięcia (opcjonalnie)
   */
  static async promote(member: GuildMember, newRoleId: string, oldRoleId?: string) {
    await MutationGate.runAtomically(async () => {
      if (oldRoleId) await member.roles.remove(oldRoleId);
      await member.roles.add(newRoleId);
    });
  }

  /**
   * Demotuje członka: usuwa starą rolę (jeśli podana) i dodaje nową
   * @param member - obiekt Discord GuildMember
   * @param newRoleId - ID roli docelowej
   * @param oldRoleId - ID roli do usunięcia (opcjonalnie)
   */
  static async demote(member: GuildMember, newRoleId: string, oldRoleId?: string) {
    await MutationGate.runAtomically(async () => {
      if (oldRoleId) await member.roles.remove(oldRoleId);
      await member.roles.add(newRoleId);
    });
  }
}