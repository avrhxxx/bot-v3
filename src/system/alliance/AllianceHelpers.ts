/**
 * ============================================
 * FILE: src/system/alliance/AllianceHelpers.ts
 * LAYER: SYSTEM (Helper Functions)
 * ============================================
 *
 * ZAWARTOŚĆ:
 * - Funkcje pomocnicze do manipulacji encją sojuszu
 * - Proste kalkulacje członków, stany orphan, audyt
 *
 * ODPOWIEDZIALNOŚĆ:
 * - Nie wykonuje żadnych zmian w Discord ani w repo
 * - Udostępnia czysto funkcjonalne operacje
 * - Używane przez AllianceManager do głównych akcji
 *
 * ============================================
 */

import { Alliance } from "./AllianceTypes";
import { db } from "../../data/Database";

export class AllianceHelpers {

  /**
   * Sprawdza, czy sojusz nie jest bez lidera (orphaned)
   * @param alliance - obiekt sojuszu
   */
  static checkOrphanState(alliance: Alliance): void {
    alliance.orphaned = !alliance.members.r5;
  }

  /**
   * Sprawdza, czy użytkownik jest członkiem sojuszu
   * @param alliance - obiekt sojuszu
   * @param userId - ID użytkownika
   * @returns true jeśli jest R5/R4/R3
   */
  static isMember(alliance: Alliance, userId: string): boolean {
    return alliance.members.r5 === userId
        || alliance.members.r4?.includes(userId)
        || alliance.members.r3?.includes(userId);
  }

  /**
   * Zwraca liczbę wszystkich członków sojuszu
   * @param alliance - obiekt sojuszu
   * @returns liczba członków
   */
  static getTotalMembers(alliance: Alliance): number {
    return (alliance.members.r5 ? 1 : 0)
         + (alliance.members.r4?.length || 0)
         + (alliance.members.r3?.length || 0);
  }

  /**
   * Zapisuje akcję do dziennika audytu
   * @param allianceId - ID sojuszu
   * @param entry - dowolne dane akcji (np. actorId, userId, action)
   */
  static logAudit(allianceId: string, entry: Omit<{ id: string } & Record<string, any>, "id">): void {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    db.journal.set(id, { id, allianceId, ...entry });
  }

}