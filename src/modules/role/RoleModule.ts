import { Guild, Role, Colors } from "discord.js";

export class RoleModule {
  // Mapowanie stworzonych ról dla sojuszy
  private static allianceRoles: Record<string, Record<string, string>> = {};

  /**
   * Tworzy podstawowe role sojuszu:
   * R5, R4, R3 + rola tożsamościowa
   * @param guild - serwer Discord
   * @param allianceTag - tag sojuszu, używany przy R5/R4/R3
   * @param allianceName - pełna nazwa sojuszu, używana przy roli tożsamościowej
   */
  static async createRoles(guild: Guild, allianceTag: string, allianceName: string) {
    if (this.allianceRoles[allianceTag]) {
      console.log(`Role dla sojuszu ${allianceTag} już istnieją.`);
      return this.allianceRoles[allianceTag];
    }

    const rolesToCreate: { name: string; color: number }[] = [
      { name: `R5[${allianceTag}]`, color: Colors.Red },
      { name: `R4[${allianceTag}]`, color: Colors.Blue },
      { name: `R3[${allianceTag}]`, color: Colors.Green },
      { name: `${allianceName}`, color: Colors.Yellow } // rola tożsamościowa
    ];

    const createdRoles: Record<string, string> = {};

    for (const { name, color } of rolesToCreate) {
      let role = guild.roles.cache.find(r => r.name === name);
      if (!role) {
        role = await guild.roles.create({
          name,
          color,
          reason: `Automatyczne tworzenie ról dla sojuszu ${allianceName}`
        });
        console.log(`Stworzono rolę: ${role.name}`);
      } else {
        console.log(`Rola ${name} już istnieje.`);
      }

      // zapisujemy ID roli
      createdRoles[name] = role.id;
    }

    this.allianceRoles[allianceTag] = createdRoles;
    return createdRoles;
  }

  /**
   * Pobiera ID roli po tagu sojuszu i nazwie roli
   */
  static getRoleId(allianceTag: string, roleName: string): string | undefined {
    return this.allianceRoles[allianceTag]?.[roleName];
  }
}