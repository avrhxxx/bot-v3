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
 * - Powiadamianie R4/R5 o nowych zgłoszeniach (join flow)
 * - Obsługa promocji i democji z broadcastami
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
 * - Komenda join powiadamia R5/R4 w staff-room, którzy mogą approve/deny
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

      // ----------------- POWIADOMIENIE DO STAFF-ROOM -----------------
      const staffMsg = `Użytkownik <@${actorId}> zgłosił chęć dołączenia do sojuszu.`;
      await BroadcastModule.sendCustomMessage(allianceId, staffMsg);

      // Dodatkowy broadcast z pingiem R5/R4
      await BroadcastModule.announceJoinRequest(allianceId, actorId, ["R5", "R4"]);
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

      // Dodatkowy broadcast z pingiem Indify w welcome channel
      await BroadcastModule.announceJoin(allianceId, userId, undefined, ["Indify"]);

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

  // ----------------- PROMOTE -----------------
  static async promoteUser(actorId: string, allianceId: string, userId: string, newRole: string): Promise<void> {
    await MutationGate.runAtomically(async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId) as any;
      const member = (alliance.members || []).find(m => m.userId === userId);
      if (!member) throw new Error("User not found in alliance");

      member.role = newRole;

      AllianceIntegrity.validate(alliance);

      // Broadcast promocji z pingiem
      await BroadcastModule.announcePromotion(allianceId, userId, newRole, undefined, ["Indify"]);

      AllianceService.logAudit(allianceId, { action: "promote", actorId, userId, newRole });
    });
  }

  // ----------------- DEMOTE -----------------
  static async demoteUser(actorId: string, allianceId: string, userId: string, newRole: string): Promise<void> {
    await MutationGate.runAtomically(async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId) as any;
      const member = (alliance.members || []).find(m => m.userId === userId);
      if (!member) throw new Error("User not found in alliance");

      member.role = newRole;

      AllianceIntegrity.validate(alliance);

      // Broadcast democji z pingiem
      await BroadcastModule.announceDemotion(allianceId, userId, newRole, undefined, ["Indify"]);

      AllianceService.logAudit(allianceId, { action: "demote", actorId, userId, newRole });
    });
  }

  // ----------------- HELPERS -----------------
  private static checkOrphanState(allianceId: string): boolean {
    const alliance = AllianceService.getAllianceOrThrow(allianceId) as any;
    return !((alliance.members || []).some(m => m.role === "R5"));
  }
}