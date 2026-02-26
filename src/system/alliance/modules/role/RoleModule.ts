/**
 * ============================================
 * MODULE: RoleModule
 * FILE: src/system/alliance/modules/role/RoleModule.ts
 * LAYER: SYSTEM (Alliance Role Management)
 * ============================================
 *
 * RESPONSIBILITY:
 * - Create Discord roles: R5, R4, R3, Identity
 * - Assign roles to members
 * - Promote/Demote actions on Discord (without limit checks)
 *
 * DEPENDENCIES:
 * - AllianceService (fetch guild member)
 * - MutationGate (atomic updates)
 * - BroadcastModule (announcement)
 *
 * ============================================
 */

import { Guild, GuildMember } from "discord.js";
import { MutationGate } from "../../../engine/MutationGate";
import { AllianceService } from "../../AllianceService";
import { BroadcastModule } from "../broadcast/BroadcastModule";

export interface AllianceRoles {
  r5RoleId: string;
  r4RoleId: string;
  r3RoleId: string;
  identityRoleId: string;
}

export type AllianceMemberRef = { userId: string; role: "R3" | "R4" | "R5" };

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

  static async assignR4Roles(member: GuildMember, roles: AllianceRoles) {
    await member.roles.add(roles.r4RoleId);
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

  // ----------------- PROMOTION / DEMOTION (DISCORD ONLY) -----------------
  static async promote(member: GuildMember, newRoleId: string, oldRoleId?: string) {
    await MutationGate.runAtomically(async () => {
      if (oldRoleId) await member.roles.remove(oldRoleId);
      await member.roles.add(newRoleId);
    });
  }

  static async demote(member: GuildMember, newRoleId: string, oldRoleId?: string) {
    await MutationGate.runAtomically(async () => {
      if (oldRoleId) await member.roles.remove(oldRoleId);
      await member.roles.add(newRoleId);
    });
  }
}