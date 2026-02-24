/**
 * ============================================
 * FILE: src/system/alliance/modules/membership/MembershipModule.ts
 * LAYER: SYSTEM (Alliance Membership Module)
 * ============================================
 *
 * MODUŁ CZŁONKOSTWA W SOJUSZU
 *
 * ODPOWIEDZIALNOŚĆ:
 * - Obsługa członkostwa (join, leave, approve/deny)
 * - Zarządzanie zgłoszeniami do sojuszu
 * - Rollback lidera w przypadku braku R5
 *
 * ZALEŻNOŚCI:
 * - AllianceService (pobranie sojuszu, logAudit)
 * - RoleModule (aktualizacja ról Discord)
 * - BroadcastModule (ogłoszenia i powiadomienia)
 * - TransferLeaderSystem (rollback lidera)
 * - AllianceIntegrity (walidacja stanu sojuszu)
 * - MutationGate (atomiczne operacje)
 *
 * UWAGA ARCHITEKTONICZNA:
 * - Wszystkie mutacje w MutationGate.runAtomically
 * - Typy członków i ról zgodne z AllianceTypes
 *
 * ============================================
 */

import { AllianceService } from "../../AllianceService";
import { RoleModule } from "../../RoleModule/RoleModule";
import { BroadcastModule } from "../../BroadcastModule/BroadcastModule";
import { TransferLeaderSystem } from "../../TransferLeaderSystem";
import { AllianceIntegrity } from "../../integrity/AllianceIntegrity";
import { MutationGate } from "../../../engine/MutationGate";

interface PendingJoin {
  userId: string;
  requestedAt: number;
}

interface MemberRecord {
  userId: string;
  role: "R3" | "R4" | "R5";
}

export class MembershipModule {

  // ----------------- JOIN REQUEST -----------------
  static async requestJoin(actorId: string, allianceId: string): Promise<void> {
    // fillpatch: atomowe dodanie pending join do sojuszu
    await MutationGate.runAtomically(async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId);

      // fillpatch: dodanie zgłoszenia
      alliance.pendingJoins = alliance.pendingJoins || [];
      alliance.pendingJoins.push({ userId: actorId, requestedAt: Date.now() });

      // fillpatch: log audytu
      AllianceService.logAudit(allianceId, { action: "requestJoin", userId: actorId });
    });
  }

  // ----------------- APPROVE JOIN -----------------
  static async approveJoin(actorId: string, allianceId: string, userId: string): Promise<void> {
    // fillpatch: atomowe zatwierdzenie członka
    await MutationGate.runAtomically(async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId);

      // fillpatch: dodanie do członków R3
      alliance.members.r3.push(userId);

      // fillpatch: usunięcie z pendingJoins
      alliance.pendingJoins = (alliance.pendingJoins || []).filter(j => j.userId !== userId);

      // fillpatch: walidacja integralności
      AllianceIntegrity.validate(alliance);

      // fillpatch: ogłoszenie do broadcast
      await BroadcastModule.announceJoin(allianceId, userId);

      // fillpatch: log audytu
      AllianceService.logAudit(allianceId, { action: "approveJoin", actorId, userId });
    });
  }

  // ----------------- DENY JOIN -----------------
  static async denyJoin(actorId: string, allianceId: string, userId: string): Promise<void> {
    // fillpatch: atomowe odrzucenie zgłoszenia
    await MutationGate.runAtomically(async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId);

      // fillpatch: usunięcie z pendingJoins
      alliance.pendingJoins = (alliance.pendingJoins || []).filter(j => j.userId !== userId);

      // fillpatch: wysłanie powiadomienia custom
      await BroadcastModule.sendCustomMessage(allianceId, `Zgłoszenie użytkownika <@${userId}> zostało odrzucone.`);

      // fillpatch: log audytu
      AllianceService.logAudit(allianceId, { action: "denyJoin", actorId, userId });
    });
  }

  // ----------------- LEAVE ALLIANCE -----------------
  static async leaveAlliance(actorId: string, allianceId: string): Promise<void> {
    // fillpatch: atomowe opuszczenie sojuszu
    await MutationGate.runAtomically(async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId);

      // fillpatch: usunięcie członka z listy
      alliance.members.r3 = (alliance.members.r3 || []).filter(id => id !== actorId);
      alliance.members.r4 = (alliance.members.r4 || []).filter(id => id !== actorId);
      if (alliance.members.r5 === actorId) {
        alliance.members.r5 = "";
      }

      // fillpatch: fallback lidera jeśli brak R5
      const leaderExists = !!alliance.members.r5;
      if (!leaderExists) {
        await TransferLeaderSystem.rollbackLeadership(allianceId);
      }

      // fillpatch: walidacja integralności
      AllianceIntegrity.validate(alliance);

      // fillpatch: ogłoszenie leave
      await BroadcastModule.announceLeave(allianceId, actorId);

      // fillpatch: log audytu
      AllianceService.logAudit(allianceId, { action: "leaveAlliance", userId: actorId });
    });
  }

  // ----------------- ROLLBACK LEADERSHIP -----------------
  static async rollbackLeadership(actorId: string, allianceId: string): Promise<void> {
    // fillpatch: atomowy rollback lidera
    await MutationGate.runAtomically(async () => {
      await TransferLeaderSystem.rollbackLeadership(allianceId);
      AllianceService.logAudit(allianceId, { action: "rollbackLeadership", actorId });
    });
  }

  // ----------------- HELPERS -----------------
  private static checkOrphanState(allianceId: string): boolean {
    // fillpatch: sprawdzenie czy brak R5
    const alliance = AllianceService.getAllianceOrThrow(allianceId);
    return !alliance.members.r5;
  }
}