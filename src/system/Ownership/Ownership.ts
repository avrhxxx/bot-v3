// File path: src/system/Ownership/Ownership.ts
/**
 * ============================================
 * MODULE: Ownership
 * FILE: src/system/Ownership/Ownership.ts
 * ============================================
 *
 * RESPONSIBILITY:
 * - Przechowuje listę użytkowników z uprawnieniami systemowymi
 * - Umożliwia sprawdzenie, czy dany userId ma prawo wykonywać komendy owner-only
 *
 * NOTES:
 * - authority IDs pobierane ze zmiennej środowiskowej `AUTHORITY_IDS`
 * - Komenda global broadcast będzie korzystać z tego modułu
 * ============================================
 */

export class Ownership {
  private static authorityIds: string[] = process.env.AUTHORITY_IDS
    ? process.env.AUTHORITY_IDS.split(",").map(id => id.trim())
    : [];

  /**
   * Sprawdza, czy podany userId znajduje się wśród authority IDs
   * @param userId - ID użytkownika do sprawdzenia
   * @returns boolean
   */
  public static isAuthority(userId: string): boolean {
    return this.authorityIds.includes(userId);
  }

  /**
   * (Opcjonalnie) metoda zwracająca wszystkie authority IDs
   */
  public static getAllAuthorities(): string[] {
    return [...this.authorityIds];
  }
}

export default Ownership;