// File path: src/system/Ownership/Ownership.ts
/**
 * ============================================
 * MODULE: Ownership
 * FILE: src/system/Ownership/Ownership.ts
 * ============================================
 *
 * RESPONSIBILITY:
 * - Defines server authority IDs from environment variables
 * - Provides helper to check if a user is authorized
 * - Synchronizes "Shadow Authority" role visually
 *
 * NOTES:
 * - Minimal version for system-level commands (e.g., global broadcast)
 * - IDs are read from process.env.AUTHORITY_IDS as comma-separated string
 * - Shadow Authority role must already exist in guild
 *
 * ============================================
 */

import { Client, Guild } from "discord.js";

export namespace Ownership {
  // 🔑 Odczyt z ENV: np. "123456789012345678,987654321098765432"
  const rawIds = process.env.AUTHORITY_IDS || "";
  export const AUTHORITY_IDS: string[] = rawIds.split(",").map(id => id.trim()).filter(Boolean).slice(0, 2);

  /**
   * Sprawdza, czy dany użytkownik ma prawa authority
   * @param userId - ID użytkownika Discord
   * @returns boolean
   */
  export function isAuthority(userId: string): boolean {
    return AUTHORITY_IDS.includes(userId);
  }

  /**
   * Nadaje rolę Shadow Authority tym użytkownikom, którzy są w AUTHORITY_IDS
   * @param client - Discord Client
   */
  export async function syncRoles(client: Client) {
    const roleName = "Shadow Authority";
    const roleColor = "#4B0082"; // ciemnofioletowy

    for (const guild of client.guilds.cache.values()) {
      const role = guild.roles.cache.find(r => r.name === roleName);
      if (!role) {
        console.warn(`⚠️ Role "${roleName}" not found in guild "${guild.name}" (${guild.id}). Skipping sync.`);
        continue;
      }

      for (const userId of AUTHORITY_IDS) {
        try {
          const member = await guild.members.fetch(userId).catch(() => null);
          if (!member) {
            console.warn(`⚠️ Authority user ${userId} not found in guild "${guild.name}".`);
            continue;
          }

          if (!member.roles.cache.has(role.id)) {
            await member.roles.add(role);
            console.log(`✅ Assigned "${roleName}" role to user ${member.user.tag} (${member.id}) in guild "${guild.name}".`);
          }
        } catch (err) {
          console.error(`❌ Failed to assign role to user ${userId} in guild "${guild.name}":`, err);
        }
      }
    }
  }

  /**
   * Inicjalizacja ownership z ENV (czyli po prostu loguje i ogranicza do 2 osób)
   */
  export function initFromEnv() {
    console.log(`✅ Shadow Authority IDs loaded from ENV: ${AUTHORITY_IDS.join(", ")}`);
  }
}