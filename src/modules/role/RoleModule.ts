import { Guild, Role, ColorResolvable } from "discord.js";

// -------------------
// ROLE MODULE
// -------------------
export class RoleModule {
  private static delayMs = 300; // domyślny delay między operacjami

  private static async delay() {
    return new Promise(resolve => setTimeout(resolve, this.delayMs));
  }

  // -------------------
  // CREATE ROLE
  // -------------------
  static async createRole(guild: Guild, name: string, color: ColorResolvable): Promise<Role> {
    const role = await guild.roles.create({ name, color });
    await this.delay();
    return role;
  }

  // -------------------
  // DELETE ROLE
  // -------------------
  static async deleteRole(role: Role): Promise<void> {
    if (!role) return;
    await role.delete().catch(() => {});
    await this.delay();
  }

  // -------------------
  // DELETE MULTIPLE ROLES
  // -------------------
  static async deleteRoles(roles: Role[]): Promise<void> {
    for (const role of roles) {
      await this.deleteRole(role);
    }
  }
}