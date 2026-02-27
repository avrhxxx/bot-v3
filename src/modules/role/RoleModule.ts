import { Guild, Role } from "discord.js";

export class RoleModule {
  static roleNames = ["R3", "R4", "R5", "Identity"];

  static async setupRoles(guild: Guild): Promise<Record<string, Role>> {
    const roles: Record<string, Role> = {};

    for (const name of RoleModule.roleNames) {
      let role = guild.roles.cache.find(r => r.name === name);
      if (!role) {
        role = await guild.roles.create({
          name,
          mentionable: true,
        });
        console.log(`Utworzono rolę: ${name}`);
      }
      roles[name] = role;
    }

    return roles;
  }
}