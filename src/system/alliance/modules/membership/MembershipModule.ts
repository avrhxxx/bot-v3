/**
 * ============================================
 * FILE: src/system/alliance/modules/membership/MembershipModule.ts
 * LAYER: SYSTEM (Alliance Membership Module)
 * ============================================
 *
 * ODPOWIEDZIALNOŚĆ:
 * - Obsługa członkostwa w sojuszach (dołączanie, opuszczanie)
 * - Zarządzanie zgłoszeniami do sojuszu (pending joins)
 * - Rollback lidera w przypadku braku R5
 *
 * ZALEŻNOŚCI:
 * - AllianceService (pobranie sojuszu i logowanie audytu)
 * - RoleModule (aktualizacja ról w Discord)
 * - BroadcastModule (ogłoszenia dla członków)
 * - TransferLeaderSystem (rollback lidera)
 * - AllianceIntegrity (walidacja stanu sojuszu)
 * - MutationGate (atomiczne operacje)
 *
 * UWAGA:
 * - Wszystkie mutacje są atomowe przez MutationGate.runAtomically
 * - Typy członków i ról są zgodne z AllianceTypes
 *
 * ============================================
 */

import { AllianceService } from "../../AllianceService";
import { RoleModule, AllianceRoles } from "../rol/RoleModule";
import { BroadcastModule } from "../broadcast/BroadcastModule";
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

  // ----------------- REQUEST JOIN -----------------
  static async requestJoin(actorId: string, allianceId: string): Promise<void> {
    await MutationGate.runAtomically(async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId) as any;

      alliance.pendingJoins = alliance.pendingJoins || [];
      alliance.pendingJoins.push({ userId: actorId, requestedAt: Date.now() });

      AllianceService.logAudit(allianceId, { action: "requestJoin", userId: actorId });
    });
  }

  // ----------------- APPROVE JOIN -----------------
  static async approveJoin(actorId: string, allianceId: string, userId: string): Promise<void> {
    await MutationGate.runAtomically(async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId) as any;
      const roles: AllianceRoles = alliance.roles || {} as any;

      alliance.members = alliance.members || [];
      alliance.members.push({ userId, role: "R3" });

      alliance.pendingJoins = (alliance.pendingJoins || []).filter(j => j.userId !== userId);

      AllianceIntegrity.validate(alliance);
      await BroadcastModule.announceJoin(allianceId, userId);

      AllianceService.logAudit(allianceId, { action: "approveJoin", actorId, userId });
    });
  }

  // ----------------- DENY JOIN -----------------
  static async denyJoin(actorId: string, allianceId: string, userId: string): Promise<void> {
    await MutationGate.runAtomically(async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId) as any;

      alliance.pendingJoins = (alliance.pendingJoins || []).filter(j => j.userId !== userId);

      await BroadcastModule.sendCustomMessage(allianceId, `Zgłoszenie użytkownika <@${userId}> zostało odrzucone.`);

      AllianceService.logAudit(allianceId, { action: "denyJoin", actorId, userId });
    });
  }

  // ----------------- LEAVE -----------------
  static async leaveAlliance(actorId: string, allianceId: string): Promise<void> {
    await MutationGate.runAtomically(async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId) as any;

      alliance.members = (alliance.members || []).filter(m => m.userId !== actorId);

      const leaderExists = (alliance.members || []).some(m => m.role === "R5");
      if (!leaderExists) {
        await TransferLeaderSystem.rollbackLeadership(allianceId);
      }

      AllianceIntegrity.validate(alliance);
      await BroadcastModule.announceLeave(allianceId, actorId);

      AllianceService.logAudit(allianceId, { action: "leaveAlliance", userId: actorId });
    });
  }

  // ----------------- ROLLBACK LEADERSHIP -----------------
  static async rollbackLeadership(actorId: string, allianceId: string): Promise<void> {
    await MutationGate.runAtomically(async () => {
      await TransferLeaderSystem.rollbackLeadership(allianceId);
      AllianceService.logAudit(allianceId, { action: "rollbackLeadership", actorId });
    });
  }

  // ----------------- HELPERS -----------------
  private static checkOrphanState(allianceId: string): boolean {
    const alliance = AllianceService.getAllianceOrThrow(allianceId) as any;
    return !((alliance.members || []).some(m => m.role === "R5"));
  }
}