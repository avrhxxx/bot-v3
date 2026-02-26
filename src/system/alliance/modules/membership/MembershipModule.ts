/**
 * ============================================
 * MODULE: MembershipModule
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
 *
 * NOTES:
 * - Member and role types align with AllianceTypes
 * - Join command notifies R5/R4 in staff-room for approval/denial
 *
 * ============================================
 */

import { AllianceService } from "../../AllianceService";
import { RoleModule } from "../role/RoleModule";
import { BroadcastModule } from "../broadcast/BroadcastModule";
import { TransferLeaderSystem } from "../../TransferLeaderSystem";
import { AllianceIntegrity } from "../../integrity/AllianceIntegrity";
import { Alliance, AllianceRole } from "../../AllianceTypes";

interface PendingJoin {
  userId: string;
  requestedAt: number;
}

export class MembershipModule {

  // ----------------- ADD JOIN REQUEST -----------------
  static async addJoinRequest(userId: string, allianceId: string): Promise<void> {
    const alliance: Alliance = AllianceService.getAllianceOrThrow(allianceId);

    alliance.pendingJoins = alliance.pendingJoins || [];
    alliance.pendingJoins.push({ userId, requestedAt: Date.now() });

    AllianceService.logAudit(allianceId, { action: "addJoinRequest", userId });

    // Notify staff-room (R5/R4)
    await BroadcastModule.sendCustomMessage(
      allianceId,
      `User <@${userId}> has requested to join the alliance.`
    );
    await BroadcastModule.announceJoinRequest(allianceId, userId, ["R5", "R4"]);
  }

  // ----------------- ACCEPT MEMBER -----------------
  static async acceptMember(actorId: string, allianceId: string, userId: string): Promise<void> {
    const alliance: Alliance = AllianceService.getAllianceOrThrow(allianceId);

    alliance.r3 = alliance.r3 || [];
    if (alliance.r3.length >= AllianceIntegrity.MAX_MEMBERS)
      throw new Error("Alliance has reached the maximum member limit (100)");

    alliance.r3.push(userId);

    // Remove pending request
    alliance.pendingJoins = (alliance.pendingJoins || []).filter(j => j.userId !== userId);

    AllianceIntegrity.validate(alliance);

    // Announce join
    await BroadcastModule.announceJoin(allianceId, userId);

    AllianceService.logAudit(allianceId, { action: "acceptMember", actorId, userId });
  }

  // ----------------- DENY MEMBER -----------------
  static async denyMember(actorId: string, allianceId: string, userId: string): Promise<void> {
    const alliance: Alliance = AllianceService.getAllianceOrThrow(allianceId);

    alliance.pendingJoins = (alliance.pendingJoins || []).filter(j => j.userId !== userId);

    await BroadcastModule.sendCustomMessage(
      allianceId,
      `Join request for user <@${userId}> has been denied.`
    );

    AllianceService.logAudit(allianceId, { action: "denyMember", actorId, userId });
  }

  // ----------------- GET PENDING REQUEST -----------------
  static getPendingRequest(allianceId: string, userId: string): PendingJoin | undefined {
    const alliance: Alliance = AllianceService.getAllianceOrThrow(allianceId);
    return alliance.pendingJoins?.find(j => j.userId === userId);
  }

  // ----------------- CAN APPROVE -----------------
  static canApprove(actorId: string, allianceId: string): boolean {
    const alliance: Alliance = AllianceService.getAllianceOrThrow(allianceId);
    return alliance.r5 === actorId || alliance.r4?.includes(actorId);
  }

  // ----------------- LEAVE ALLIANCE -----------------
  static async leaveAlliance(actorId: string, allianceId: string): Promise<void> {
    const alliance: Alliance = AllianceService.getAllianceOrThrow(allianceId);

    alliance.r3 = (alliance.r3 || []).filter(u => u !== actorId);
    alliance.r4 = (alliance.r4 || []).filter(u => u !== actorId);
    if (alliance.r5 === actorId) alliance.r5 = null;

    if (!alliance.r5) console.warn(
      `[MembershipModule] Leader has been removed. Manual TransferLeaderSystem.transferLeadership required.`
    );

    AllianceIntegrity.validate(alliance);
    await BroadcastModule.announceLeave(allianceId, actorId);

    AllianceService.logAudit(allianceId, { action: "leaveAlliance", userId: actorId });
  }

  // ----------------- PROMOTE MEMBER -----------------
  static async promoteMember(actorId: string, allianceId: string, userId: string): Promise<void> {
    const alliance: Alliance = AllianceService.getAllianceOrThrow(allianceId);

    // Move from R3 → R4
    if (!alliance.r3?.includes(userId)) throw new Error("User is not R3");
    alliance.r4 = alliance.r4 || [];
    alliance.r4.push(userId);
    alliance.r3 = alliance.r3.filter(u => u !== userId);

    AllianceIntegrity.validate(alliance);

    await BroadcastModule.announcePromotion(allianceId, userId, "R4");
    AllianceService.logAudit(allianceId, { action: "promoteMember", actorId, userId, newRole: "R4" });
  }

  // ----------------- DEMOTE MEMBER -----------------
  static async demoteMember(actorId: string, allianceId: string, userId: string): Promise<void> {
    const alliance: Alliance = AllianceService.getAllianceOrThrow(allianceId);

    // Move from R4 → R3
    if (!alliance.r4?.includes(userId)) throw new Error("User is not R4");
    alliance.r3 = alliance.r3 || [];
    alliance.r3.push(userId);
    alliance.r4 = alliance.r4.filter(u => u !== userId);

    AllianceIntegrity.validate(alliance);

    await BroadcastModule.announceDemotion(allianceId, userId, "R3");
    AllianceService.logAudit(allianceId, { action: "demoteMember", actorId, userId, newRole: "R3" });
  }

}