/**
 * ============================================
 * FILE: src/system/Ownership/Ownership.ts
 * LAYER: SYSTEM
 * ============================================
 *
 * ODPOWIEDZIALNOŚĆ:
 * - Przechowywanie i kontrola właścicieli globalnych (Shadow Authority)
 * - Nadawanie roli Shadow Authority w Discord
 * - Sprawdzenia uprawnień (bot owner lub guild owner)
 *
 * ZALEŻNOŚCI:
 * - discord.js (Client, Guild)
 *
 * ============================================
 */

import { Client, Guild, Role, ColorResolvable } from "discord.js";

const ROLE_NAME = "Shadow Authority";
const ROLE_COLOR: ColorResolvable = "#4B0082"; // ciemnofioletowy

/**
 * Obsługa globalnych właścicieli botów (Shadow Authority)
 * Obsługuje maksymalnie dwóch użytkowników, oddzielonych przecinkiem w zmiennej środowiskowej AUTHORITY_IDS
 */
export class Ownership {
  private static authorityIds: Set<string> = new Set();

  /**
   * Inicjalizacja z ENV
   */
  static initFromEnv() {
    const env = process.env.AUTHORITY_IDS || "";
    const ids = env.split(",").map(s => s.trim()).filter(Boolean).slice(0, 2);
    this.authorityIds = new Set(ids);
  }

  /**
   * Sprawdza, czy userId jest globalnym właścicielem (Shadow Authority)
   */
  static isAuthority(userId: string): boolean {
    return this.authorityIds.has(userId);
  }

  /**
   * Sprawdza, czy userId jest właścicielem guild
   */
  static isGuildOwner(userId: string, guild: Guild): boolean {
    return guild.ownerId === userId;
  }

  /**
   * Weryfikuje uprawnienia Shadow Authority, rzuca błąd jeśli brak
   */
  static requireAuthority(userId: string, guild?: Guild) {
    if (!this.isAuthority(userId) && !(guild && this.isGuildOwner(userId, guild))) {
      throw new Error("User is not Shadow Authority or Guild Owner.");
    }
  }

  /**
   * Tworzy rolę Shadow Authority w każdej guildzie i przydziela ją użytkownikom
   */
  static async syncRoles(client: Client) {
    for (const [, guild] of client.guilds.cache) {
      await this.ensureRole(guild);
    }
  }

  private static async ensureRole(guild: Guild) {
    let role: Role | undefined = guild.roles.cache.find(r => r.name === ROLE_NAME);
    if (!role) {
      try {
        role = await guild.roles.create({
          name: ROLE_NAME,
          color: ROLE_COLOR,
          reason: "Automatyczne tworzenie roli Shadow Authority",
        });
        console.log(`✅ Role '${ROLE_NAME}' created in guild ${guild.name}`);
      } catch (err) {
        console.error(`❌ Failed to create role '${ROLE_NAME}' in guild ${guild.name}:`, err);
        return;
      }
    }

    for (const userId of this.authorityIds) {
      const member = await guild.members.fetch(userId).catch(() => null);
      if (!member) continue;

      if (!member.roles.cache.has(role.id)) {
        await member.roles.add(role).catch(err => {
          console.error(`❌ Failed to assign role '${ROLE_NAME}' to user ${userId}:`, err);
        });
        console.log(`✅ Role '${ROLE_NAME}' assigned to user ${userId} in guild ${guild.name}`);
      }
    }
  }
}

// --- Inicjalizacja z ENV ---
Ownership.initFromEnv();