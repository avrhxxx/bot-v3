import { Guild, Role, GuildMember } from "discord.js";

export interface AllianceRoles {
  r5RoleId: string;
  r4RoleId: string;
  r3RoleId: string;
  identityRoleId: string;
}

export class RoleModule {
  /**
   * Tworzy role R5, R4, R3 i identity w danym guildzie
   */
  static async createRoles(guild: Guild, tag: string): Promise<AllianceRoles> {
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

  /**
   * Przypisuje role liderowi R5 + Identity
   */
  static async assignLeaderRoles(member: GuildMember, roles: AllianceRoles) {
    await member.roles.add([roles.r5RoleId, roles.identityRoleId]);
  }

  /**
   * Sprawdza czy użytkownik posiada rolę R5, R4, R3
   */
  static hasRole(member: GuildMember, roleId: string): boolean {
    return member.roles.cache.has(roleId);
  }
}