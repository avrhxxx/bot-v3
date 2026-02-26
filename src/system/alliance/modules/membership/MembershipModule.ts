/**
 * ============================================
 * MODULE: MembershipModule
 * FILE: src/system/alliance/modules/membership/MembershipModule.ts
 * LAYER: SYSTEM (Alliance Membership Management)
 * ============================================
 *
 * RESPONSIBILITY:
 * - Manage join requests, accept/deny members
 * - Promote/Demote members
 * - Leave alliance
 * - Use RulesModule for validations
 *
 * DEPENDENCIES:
 * - AllianceService (fetch alliance data)
 * - RoleModule (Discord role updates)
 * - BroadcastModule (announcements)
 * - MutationGate (atomic operations)
 * - RulesModule (enforce limits)
 *
 * ============================================
 */

import { RoleModule } from "../role/RoleModule";
import { BroadcastModule } from "../broadcast/BroadcastModule";
import { MutationGate } from "../../../engine/MutationGate";
import { AllianceService } from "../../AllianceService";
import { RulesModule } from "../rules/RulesModule";
import { Alliance } from "../../AllianceTypes";

interface PendingJoin { userId: string; requestedAt: number; }

export class MembershipModule {
  static async addJoinRequest(userId: string, allianceId: string) {
    await MutationGate.execute({ actor: userId, operation: "addJoinRequest", allianceId }, async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId);
      alliance.pendingJoins = alliance.pendingJoins || [];
      alliance.pendingJoins.push({ userId, requestedAt: Date.now() });

      await BroadcastModule.announceJoinRequest(allianceId, userId);
      AllianceService.logAudit(allianceId, { action: "addJoinRequest", userId });
    });
  }

  static async acceptMember(actorId: string, allianceId: string, userId: string) {
    await MutationGate.execute({ actor: actorId, operation: "acceptMember", allianceId }, async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId);
      alliance.members.r3 = alliance.members.r3 || [];
      alliance.members.r3.push(userId);

      RulesModule.validateNewMember(alliance);

      await BroadcastModule.announceJoin(allianceId, userId);
      AllianceService.logAudit(allianceId, { action: "acceptMember", actorId, userId });
    });
  }

  static async promoteMember(actorId: string, allianceId: string, userId: string) {
    await MutationGate.execute({ actor: actorId, operation: "promoteMember", allianceId }, async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId);
      alliance.members.r4 = alliance.members.r4 || [];
      alliance.members.r3 = alliance.members.r3 || [];

      if (!alliance.members.r3.includes(userId)) throw new Error("User is not R3");

      RulesModule.validatePromotion(alliance, "R4");

      alliance.members.r3 = alliance.members.r3.filter(u => u !== userId);
      alliance.members.r4.push(userId);

      await BroadcastModule.announcePromotion(allianceId, userId, "R4");
      AllianceService.logAudit(allianceId, { action: "promoteMember", actorId, userId, newRole: "R4" });
    });
  }

  static async demoteMember(actorId: string, allianceId: string, userId: string) {
    await MutationGate.execute({ actor: actorId, operation: "demoteMember", allianceId }, async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId);
      alliance.members.r3 = alliance.members.r3 || [];
      alliance.members.r4 = alliance.members.r4 || [];

      if (!alliance.members.r4.includes(userId)) throw new Error("User is not R4");

      RulesModule.validateDemotion(alliance, "R3");

      alliance.members.r4 = alliance.members.r4.filter(u => u !== userId);
      alliance.members.r3.push(userId);

      await BroadcastModule.announceDemotion(allianceId, userId, "R3");
      AllianceService.logAudit(allianceId, { action: "demoteMember", actorId, userId, newRole: "R3" });
    });
  }
}