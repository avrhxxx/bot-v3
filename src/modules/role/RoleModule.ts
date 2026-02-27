import { Guild, Role } from "discord.js";

export class RoleModule {
  static async createRole(guild: Guild, name: string, color: number): Promise<Role> {
    let role = guild.roles.cache.find(r => r.name === name);
    if (!role) {
      role = await guild.roles.create({ name, color, reason: "Tworzenie roli sojuszu" });
    }
    return role;
  }
}