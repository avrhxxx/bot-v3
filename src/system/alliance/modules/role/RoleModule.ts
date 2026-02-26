import { Guild, GuildMember } from "discord.js";
import { MutationGate } from "../../../engine/MutationGate";
import { AllianceService } from "../../AllianceService";

export interface AllianceRoles {
  r5RoleId: string;
  r4RoleId: string;
  r3RoleId: string;
  identityRoleId: string;
}

export class RoleModule {
  static async createRoles(guild: Guild, allianceId: string, tag: string): Promise<AllianceRoles> {
    const r5 = await guild.roles.create({ name: `R5-${tag}`, mentionable: false });
    const r4 = await guild.roles.create({ name: `R4-${tag}`, mentionable: false });
    const r3 = await guild.roles.create({ name: `R3-${tag}`, mentionable: false });
    const identity = await guild.roles.create({ name: `${tag}`, mentionable: true });

    return { r5RoleId: r5.id, r4RoleId: r4.id, r3RoleId: r3.id, identityRoleId: identity.id };
  }

  static async assignLeaderRoles(member: GuildMember, roles: AllianceRoles) {
    await member.roles.add([roles.r5RoleId, roles.identityRoleId]);
  }

  static async assignR4Roles(member: GuildMember, roles: AllianceRoles) {
    await member.roles.add(roles.r4RoleId);
  }

  static async assignRole(member: GuildMember, roleId: string) {
    await MutationGate.runAtomically(async () => { await member.roles.add(roleId); });
  }

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