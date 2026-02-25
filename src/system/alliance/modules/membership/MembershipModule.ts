/**
 * ============================================
 * FILE: src/system/alliance/modules/membership/MembershipModule.ts
 * LAYER: SYSTEM (Alliance Membership Module)
 * ============================================
 *
 * RESPONSIBILITIES:
 * - Handling alliance membership (join/leave)
 * - Managing pending join requests
 * - Notifying R4/R5 on new join requests
 * - Handling promotions and demotions with broadcasts
 *
 * DEPENDENCIES:
 * - AllianceService (fetch alliance & audit logs)
 * - RoleModule (Discord role updates)
 * - BroadcastModule (member announcements)
 * - TransferLeaderSystem (manual leader transfer)
 * - AllianceIntegrity (alliance state validation)
 * - MutationGate (atomic operations)
 *
 * NOTES:
 * - All mutations are atomic via MutationGate.runAtomically
 * - Member and role types align with AllianceTypes
 * - Join command notifies R5/R4 in staff-room for approval/denial
 *
 * ============================================
 */

import { AllianceService } from "../../AllianceService";
import { RoleModule } from "../role/RoleModule"; // <- poprawiona ścieżka
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

      // ----------------- NOTIFY STAFF-ROOM -----------------
      const staffMsg = `User <@${actorId}> has requested to join the alliance.`;
      await BroadcastModule.sendCustomMessage(allianceId, staffMsg);

      // Additional broadcast pinging R5/R4
      await BroadcastModule.announceJoinRequest(allianceId, actorId, ["R5", "R4"]);
    });
  }

  // ----------------- APPROVE JOIN -----------------
  static async approveJoin(actorId: string, allianceId: string, userId: string): Promise<void> {
    await MutationGate.runAtomically(async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId) as any;

      // Validate member limit before adding
      const totalMembers = (alliance.members?.length ?? 0) + 1; // include new member
      if (totalMembers > AllianceIntegrity.MAX_MEMBERS) {
        throw new Error("Alliance has reached the maximum member limit (100)");
      }

      alliance.members = alliance.members || [];
      alliance.members.push({ userId, role: "R3" });

      alliance.pendingJoins = (alliance.pendingJoins || []).filter(j => j.userId !== userId);

      AllianceIntegrity.validate(alliance);

      await BroadcastModule.announceJoin(allianceId, userId);

      // Additional broadcast pinging Indify in welcome channel
      await BroadcastModule.announceJoin(allianceId, userId, undefined, ["Indify"]);

      AllianceService.logAudit(allianceId, { action: "approveJoin", actorId, userId });
    });
  }

  // ----------------- DENY JOIN -----------------
  static async denyJoin(actorId: string, allianceId: string, userId: string): Promise<void> {
    await MutationGate.runAtomically(async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId) as any;

      alliance.pendingJoins = (alliance.pendingJoins || []).filter(j => j.userId !== userId);

      await BroadcastModule.sendCustomMessage(allianceId, `Join request for user <@${userId}> has been denied.`);

      AllianceService.logAudit(allianceId, { action: "denyJoin", actorId, userId });
    });
  }

  // ----------------- LEAVE -----------------
  static async leaveAlliance(actorId: string, allianceId: string): Promise<void> {
    await MutationGate.runAtomically(async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId) as any;

      alliance.members = (alliance.members || []).filter(m => m.userId !== actorId);

      // If the leader is removed, manual leader transfer is required
      const leaderExists = (alliance.members || []).some(m => m.role === "R5");
      if (!leaderExists) {
        console.warn(`[MembershipModule] Leader has been removed. Manual TransferLeaderSystem.transferLeadership required.`);
      }

      AllianceIntegrity.validate(alliance);
      await BroadcastModule.announceLeave(allianceId, actorId);

      AllianceService.logAudit(allianceId, { action: "leaveAlliance", userId: actorId });
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

      await BroadcastModule.announcePromotion(allianceId, userId, newRole, undefined, ["Indify"]);

      AllianceService.logAudit(allianceId, { action: "promote", actorId, userId, newRole });
    });
  }

  // ----------------- DEMOTE -----------------
  static async demoteUser(actorId: string, allianceId: string, userId: string, newRole: string): Promise<void> {
    await MutationGate.runAtomically(async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId) as any;
      const member = (alliance.members || []).find(m