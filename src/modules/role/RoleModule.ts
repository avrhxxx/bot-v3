import { Guild, Role } from "discord.js";

const INTERNAL_ROLE_DELAY = 300; // zabezpieczenie przed rate limit

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class RoleModule {

  /**
   * Tworzy rolę w guild
   */
  static async createRole(
    guild: Guild,
    name: string,
    color: number
  ): Promise<Role> {

    const role = await guild.roles.create({
      name,
      color
    });

    // wewnętrzny delay ochronny
    await delay(INTERNAL_ROLE_DELAY);

    return role;
  }

  /**
   * Usuwa rolę po ID
   */
  static async deleteRole(
    guild: Guild,
    roleId: string
  ): Promise<void> {

    const role = guild.roles.cache.get(roleId);
    if (!role) return;

    await role.delete();

    // wewnętrzny delay ochronny
    await delay(INTERNAL_ROLE_DELAY);
  }
}