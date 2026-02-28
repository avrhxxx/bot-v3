// src/modules/role/RoleModule.ts
import { Guild, Role, Message } from "discord.js";
import { EmbedFactory } from "../../EmbedBuilder";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class RoleModule {

  // ================================
  // CREATE ROLES
  // ================================
  static async createRoles(
    guild: Guild,
    rolesData: { name: string; color?: number }[],
    logMessage?: Message
  ): Promise<Record<string, string>> {
    const createdRoles: Record<string, string> = {};
    const roleLogs: string[] = [];

    for (const r of rolesData) {
      const role = await guild.roles.create({ name: r.name, color: r.color });
      createdRoles[r.name] = role.id;
      roleLogs.push(`✅ ${r.name}`);

      if (logMessage) {
        await logMessage.edit({
          embeds: [EmbedFactory.buildAllianceOperation("📦 Creating Roles", roleLogs, [], false)]
        });
      }

      await delay(300); // zabezpieczenie API
    }

    if (logMessage) {
      await logMessage.edit({
        embeds: [EmbedFactory.buildAllianceOperation("📦 Creating Roles", roleLogs, [], true)]
      });
    }

    return createdRoles;
  }

  // ================================
  // DELETE ROLES
  // ================================
  static async deleteRoles(
    guild: Guild,
    roleIds: string[],
    logMessage?: Message
  ): Promise<void> {
    const roleLogs: string[] = [];

    for (const id of roleIds) {
      const role = guild.roles.cache.get(id);
      if (!role) continue;

      roleLogs.push(`🗑 ${role.name}`);
      await role.delete();

      if (logMessage) {
        await logMessage.edit({
          embeds: [EmbedFactory.buildAllianceOperation("🗑 Deleting Roles", roleLogs, [], false)]
        });
      }

      await delay(300);
    }

    if (logMessage) {
      await logMessage.edit({
        embeds: [EmbedFactory.buildAllianceOperation("🗑 Deleting Roles", roleLogs, [], true)]
      });
    }
  }

  // ================================
  // RESTORE EXISTING ROLES (RolesUnit)
  // ================================
  static async restoreRoles(
    guild: Guild,
    rolesData: { name: string; id: string; color?: number }[],
    logMessage?: Message
  ): Promise<void> {
    const roleLogs: string[] = [];

    for (const r of rolesData) {
      let role = guild.roles.cache.get(r.id);
      if (!role) {
        role = await guild.roles.create({ name: r.name, color: r.color });
      }

      roleLogs.push(`🔄 ${r.name}`);

      if (logMessage) {
        await logMessage.edit({
          embeds: [EmbedFactory.buildAllianceOperation("🔄 Restoring Roles", roleLogs, [], false)]
        });
      }

      await delay(300);
    }

    if (logMessage) {
      await logMessage.edit({
        embeds: [EmbedFactory.buildAllianceOperation("🔄 Restoring Roles", roleLogs, [], true)]
      });
    }
  }
}