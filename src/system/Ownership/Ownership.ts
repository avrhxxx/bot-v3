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
 *
 * NOTES:
 * - Minimal version for system-level commands (e.g., global broadcast)
 * - IDs are read from process.env.AUTHORITY_IDS as comma-separated string
 *
 * ============================================
 */

export namespace Ownership {
  // 🔑 Odczyt z ENV: np. "123456789012345678,987654321098765432"
  const rawIds = process.env.AUTHORITY_IDS || "";
  export const AUTHORITY_IDS: string[] = rawIds.split(",").map(id => id.trim()).filter(Boolean);

  /**
   * Sprawdza, czy dany użytkownik ma prawa authority
   * @param userId - ID użytkownika Discord
   * @returns boolean
   */
  export function isAuthority(userId: string): boolean {
    return AUTHORITY_IDS.includes(userId);
  }
}