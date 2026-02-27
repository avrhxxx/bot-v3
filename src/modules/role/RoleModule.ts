import { Guild } from "discord.js";

export class RoleModule {
  static async ensureRoles(guild: Guild) {
    const roles = ["R5", "R4", "R3"];
    for (const roleName of roles) {
      let role = guild.roles.cache.find(r => r.name === roleName);
      if (!role) {
        role = await guild.roles.create({
          name: roleName,
          color: roleName === "R5" ? "Red" : roleName === "R4" ? "Blue" : "Green",
          reason: "Stub: tworzenie ról sojuszu"
        });
        console.log(`Stworzono rolę ${role.name}`);
      }
    }
  }
}