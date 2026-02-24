/**
 * ============================================
 * FILE: src/system/Ownership/OwnerRoleManager.ts
 * LAYER: SYSTEM / Ownership
 * ============================================
 *
 * ODPOWIEDZIALNOŚĆ:
 * - Zapewnienie istnienia ról BotOwner i DiscordOwner w Discord
 * - Automatyczne nadawanie ról przy starcie bota
 * - Niezależne od systemu sojuszy
 *
 * ZALEŻNOŚCI:
 * - discord.js (Client, Guild, Roles)
 * - Ownership (repo i ID właścicieli)
 *
 * UWAGA:
 * - Bezpieczne dla awarii systemu sojuszy
 * - Można wywołać w bootstrap przed załadowaniem komend
 *
 * ============================================
 */

import { Client, Guild, Role, ColorResolvable } from "discord.js";
import { Ownership } from "../Ownership";

export class OwnerRoleManager {
  static BOT_ROLE_NAME = "BotOwner";
  static DISCORD_ROLE_NAME = "DiscordOwner";

  /**
   * Upewnij się, że role istnieją w każdej guild i nadaj je odpowiednim użytkownikom
   */
  static async syncRoles(client: Client) {
    const botOwnerId = Ownership.getBotOwner();
    const discordOwnerId = Ownership.getDiscordOwner();

    if (!botOwnerId || !discordOwnerId) {
      console.warn("❌ BotOwner or DiscordOwner not set in Ownership repo.");
      return;
    }

    for (const [, guild] of client.guilds.cache) {
      await this.ensureRole(guild, this.BOT_ROLE_NAME, botOwnerId);
      await this.ensureRole(guild, this.DISCORD_ROLE_NAME, discordOwnerId);
    }
  }

  private static async ensureRole(guild: Guild, roleName: string, userId: string) {
    let role: Role | undefined = guild.roles.cache.find(r => r.name === roleName);
    if (!role) {
      try {
        // Poprawione typowanie kolorów ról, zgodne z discord.js
        const color: ColorResolvable = roleName === this.BOT_ROLE_NAME ? "Blue" : "Green";
        role = await guild.roles.create({
          name: roleName,
          color,
          reason: "Automatyczne tworzenie roli właściciela"
        });
        console.log(`✅ Role '${roleName}' created in guild ${guild.name}`);
      } catch (err) {
        console.error(`❌ Failed to create role '${roleName}' in guild ${guild.name}:`, err);
        return;
      }
    }

    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member) return;

    if (!member.roles.cache.has(role.id)) {
      await member.roles.add(role).catch(err => {
        console.error(`❌ Failed to add role '${roleName}' to user ${userId}:`, err);
      });
      console.log(`✅ Role '${roleName}' assigned to user ${userId} in guild ${guild.name}`);
    }
  }
}