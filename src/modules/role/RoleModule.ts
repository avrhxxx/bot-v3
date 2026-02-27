import { Guild, Role, GuildMember, PermissionFlagsBits } from "discord.js";

export class RoleModule {
  constructor(private guild: Guild) {}

  async createRoles() {
    const roleNames = ["R5 - Leader", "R4 - Officer", "R3 - Member", "Identity"];
    for (const name of roleNames) {
      if (!this.guild.roles.cache.find(r => r.name === name)) {
        await this.guild.roles.create({
          name,
          permissions: [],
        });
      }
    }
  }

  async assignRole(member: GuildMember, roleName: string) {
    const role = this.guild.roles.cache.find(r => r.name === roleName);
    if (role) {
      await member.roles.add(role);
    } else {
      throw new Error(`Role ${roleName} does not exist`);
    }
  }

  async removeRole(member: GuildMember, roleName: string) {
    const role = this.guild.roles.cache.find(r => r.name === roleName);
    if (role) {
      await member.roles.remove(role);
    }
  }
}