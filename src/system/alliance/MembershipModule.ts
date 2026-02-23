// src/system/alliance/MembershipModule.ts

/**
 * Moduł: MembershipModule
 * Cel: obsługa dołączania i opuszczania sojuszu
 * Integruje się z:
 * - AllianceService – aktualizacja stanu sojuszu
 * - RoleModule – przydział ról R3/R4
 * - BroadcastModule – powiadomienia o zmianach członków
 * - TransferLeaderSystem – rollback lub akceptacja nowego lidera
 * - AllianceIntegrity – walidacja spójności
 * - MutationGate – atomowe operacje
 * - AllianceLock / GlobalLock – blokady operacji krytycznych
 */

import { AllianceService } from "./AllianceService";
import { RoleModule } from "./RoleModule";
import { BroadcastModule } from "./BroadcastModule";
import { TransferLeaderSystem } from "./TransferLeaderSystem";
import { AllianceIntegrity } from "./integrity/AllianceIntegrity";
import { MutationGate } from "../../engine/MutationGate";

export class MembershipModule {
  // ----------------- JOIN -----------------
  /**
   * Zgłoszenie chęci dołączenia do sojuszu
   */
  static async requestJoin(actorId: string, allianceId: string) { /* implementacja */ }

  /**
   * Akceptacja zgłoszenia przez R5/R4
   * Integracja: AllianceService, RoleModule, BroadcastModule, AllianceIntegrity
   */
  static async approveJoin(actorId: string, allianceId: string, userId: string) { /* implementacja */ }

  /**
   * Odrzucenie zgłoszenia
   */
  static async denyJoin(actorId: string, allianceId: string, userId: string) { /* implementacja */ }

  // ----------------- LEAVE -----------------
  /**
   * Użytkownik opuszcza sojusz
   * Aktualizacja w AllianceService i powiadomienie BroadcastModule
   */
  static async leaveAlliance(actorId: string, allianceId: string) { /* implementacja */ }

  // ----------------- LEADERSHIP -----------------
  /**
   * Rollback lidera – przywrócenie poprzedniego lidera w przypadku odrzucenia roli przez aktualnego
   */
  static async rollbackLeadership(actorId: string, allianceId: string) { /* implementacja */ }

  // ----------------- HELPERS / INTEGRITY -----------------
  /**
   * Sprawdzenie, czy sojusz pozostaje bez lidera
   */
  private static checkOrphanState(allianceId: string) { /* implementacja */ }
}