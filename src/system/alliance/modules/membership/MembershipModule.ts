/**
 * ============================================
 * FILE: src/system/alliance/modules/membership/MembershipModule.ts
 * LAYER: SYSTEM (Alliance Membership Module)
 * ============================================
 *
 * ODPOWIEDZIALNOŚĆ:
 * - Zarządzanie członkostwem w sojuszu (dołączanie, opuszczanie)
 * - Obsługa zgłoszeń do sojuszu
 * - Promocja / degradacja członków
 * - Rollback lidera w przypadku braku R5
 * - Emitowanie broadcastów dla członków
 *
 * ZALEŻNOŚCI:
 * - AllianceService (pobranie sojuszu, logAudit)
 * - RoleModule (aktualizacja ról Discord)
 * - BroadcastModule (ogłoszenia)
 * - TransferLeaderSystem (rollback lidera)
 * - AllianceIntegrity (walidacja stanu sojuszu)
 * - MutationGate (atomiczne operacje)
 *
 * UWAGA ARCHITEKTONICZNA:
 * - Wszystkie mutacje wykonywane w MutationGate.runAtomically
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
import { Alliance, AllianceMembers } from "../../AllianceTypes";

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
      const alliance = AllianceService.getAllianceOrThrow(allianceId) as Alliance;

      alliance.pendingJoins = alliance.pendingJoins || [];
      if (!alliance.pendingJoins.find(j => j.userId === actorId)) {
        alliance.pendingJoins.push({ userId: actorId, requestedAt: Date.now() });
        AllianceService.logAudit(allianceId, { action: "requestJoin", userId: actorId });
      }
    });
  }

  // ----------------- APPROVE JOIN -----------------
  static async approveJoin(actorId: string, allianceId: string, userId: string): Promise<void> {
    await MutationGate.runAtomically(async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId) as Alliance;

      alliance.members = alliance.members || { r5: "", r4: [], r3: [] };
      alliance.members.r3.push(userId);

      alliance.pendingJoins = (alliance.pendingJoins || []).filter(j => j.userId !== userId);

      AllianceIntegrity.validate(alliance);
      await BroadcastModule.announceJoin(allianceId, userId);
      AllianceService.logAudit(allianceId, { action: "approveJoin", actorId, userId });
    });
  }

  // ----------------- DENY JOIN -----------------
  static async denyJoin(actorId: string, allianceId: string, userId: string): Promise<void> {
    await MutationGate.runAtomically(async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId) as Alliance;

      alliance.pendingJoins = (alliance.pendingJoins || []).filter(j => j.userId !== userId);

      await BroadcastModule.sendCustomMessage(allianceId, `Zgłoszenie użytkownika <@${userId}> zostało odrzucone.`);

      AllianceService.logAudit(allianceId, { action: "denyJoin", actorId, userId });
    });
  }

  // ----------------- LEAVE ALLIANCE -----------------
  static async leaveAlliance(actorId: string, allianceId: string): Promise<void> {
    await MutationGate.runAtomically(async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId) as Alliance;

      alliance.members.r3 = (alliance.members.r3 || []).filter(u => u !== actorId);
      alliance.members.r4 = (alliance.members.r4 || []).filter(u => u !== actorId);
      if (alliance.members.r5 === actorId) alliance.members.r5 = "";

      const leaderExists = alliance.members.r5 !== "";
      if (!leaderExists) {
        await TransferLeaderSystem.rollbackLeadership(allianceId);
      }

      AllianceIntegrity.validate(alliance);
      await BroadcastModule.announceLeave(allianceId, actorId);

      AllianceService.logAudit(allianceId, { action: "leaveAlliance", userId: actorId });
    });
  }

  // ----------------- PROMOTE -----------------
  static async promote(actorId: string, allianceId: string, userId: string): Promise<void> {
    await MutationGate.runAtomically(async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId) as Alliance;

      if (alliance.members.r3.includes(userId)) {
        alliance.members.r3 = alliance.members.r3.filter(u => u !== userId);
        alliance.members.r4.push(userId);
      } else if (alliance.members.r4.includes(userId)) {
        alliance.members.r4 = alliance.members.r4.filter(u => u !== userId);
        alliance.members.r5 = userId;
      }

      AllianceIntegrity.validate(alliance);
      await BroadcastModule.sendCustomMessage(allianceId, `Użytkownik <@${userId}> został promowany.`);
      AllianceService.logAudit(allianceId, { action: "promote", actorId, userId });
    });
  }

  // ----------------- DEMOTE -----------------
  static async demote(actorId: string, allianceId: string, userId: string): Promise<void> {
    await MutationGate.runAtomically(async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId) as Alliance;

      if (alliance.members.r5 === userId) {
        alliance.members.r5 = "";
        alliance.members.r4.push(userId);
      } else if (alliance.members.r4.includes(userId)) {
        alliance.members.r4 = alliance.members.r4.filter(u => u !== userId);
        alliance.members.r3.push(userId);
      }

      AllianceIntegrity.validate(alliance);
      await BroadcastModule.sendCustomMessage(allianceId, `Użytkownik <@${userId}> został zdegradowany.`);
      AllianceService.logAudit(allianceId, { action: "demote", actorId, userId });
    });
  }

  // ----------------- HELPERS -----------------
  static isMember(allianceId: string, userId: string): boolean {
    const alliance = AllianceService.getAllianceOrThrow(allianceId) as Alliance;
    return (
      alliance.members.r5 === userId ||
      alliance.members.r4.includes(userId) ||
      alliance.members.r3.includes(userId)
    );
  }

  static hasLeader(allianceId: string): boolean {
    const alliance = AllianceService.getAllianceOrThrow(allianceId) as Alliance;
    return alliance.members.r5 !== "";
  }
}