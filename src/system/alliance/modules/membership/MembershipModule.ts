import { AllianceService } from "../../AllianceService";
import { RoleModule } from "../role/RoleModule";
import { BroadcastModule } from "../broadcast/BroadcastModule";
import { TransferLeaderSystem } from "../../TransferLeaderSystem";
import { AllianceIntegrity } from "../../integrity/AllianceIntegrity";
import { MutationGate } from "../../../engine/MutationGate";
import { Alliance } from "../../AllianceTypes";

interface PendingJoin {
  userId: string;
  requestedAt: number;
}

export class MembershipModule {

  // ----------------- ADD JOIN REQUEST -----------------
  static async addJoinRequest(userId: string, allianceId: string): Promise<void> {
    await MutationGate.execute({ actor: userId, operation: "addJoinRequest", allianceId }, async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId);

      alliance.pendingJoins = alliance.pendingJoins || [];
      alliance.pendingJoins.push({ userId, requestedAt: Date.now() });

      AllianceService.logAudit(allianceId, { action: "addJoinRequest", userId });

      await BroadcastModule.sendCustomMessage(allianceId, `User <@${userId}> has requested to join the alliance.`);
      await BroadcastModule.announceJoinRequest(allianceId, userId, ["R5", "R4"]);
    });
  }

  // ----------------- ACCEPT MEMBER -----------------
  static async acceptMember(actorId: string, allianceId: string, userId: string): Promise<void> {
    await MutationGate.execute({ actor: actorId, operation: "acceptMember", allianceId }, async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId);

      alliance.r3 = alliance.r3 || [];
      if (alliance.r3.length >= AllianceIntegrity.MAX_MEMBERS)
        throw new Error("Alliance has reached the maximum member limit (100)");

      alliance.r3.push(userId);

      alliance.pendingJoins = (alliance.pendingJoins || []).filter(j => j.userId !== userId);

      AllianceIntegrity.validate(alliance);

      await BroadcastModule.announceJoin(allianceId, userId);
      AllianceService.logAudit(allianceId, { action: "acceptMember", actorId, userId });
    });
  }

  // ----------------- DENY MEMBER -----------------
  static async denyMember(actorId: string, allianceId: string, userId: string): Promise<void> {
    await MutationGate.execute({ actor: actorId, operation: "denyMember", allianceId }, async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId);

      alliance.pendingJoins = (alliance.pendingJoins || []).filter(j => j.userId !== userId);

      await BroadcastModule.sendCustomMessage(allianceId, `Join request for user <@${userId}> has been denied.`);
      AllianceService.logAudit(allianceId, { action: "denyMember", actorId, userId });
    });
  }

  // ----------------- GET PENDING REQUEST -----------------
  static getPendingRequest(allianceId: string, userId: string): PendingJoin | undefined {
    const alliance = AllianceService.getAllianceOrThrow(allianceId);
    return alliance.pendingJoins?.find(j => j.userId === userId);
  }

  // ----------------- CAN APPROVE -----------------
  static canApprove(actorId: string, allianceId: string): boolean {
    const alliance = AllianceService.getAllianceOrThrow(allianceId);
    return alliance.r5 === actorId || alliance.r4?.includes(actorId);
  }

  // ----------------- LEAVE ALLIANCE -----------------
  static async leaveAlliance(actorId: string, allianceId: string): Promise<void> {
    await MutationGate.execute({ actor: actorId, operation: "leaveAlliance", allianceId }, async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId);

      alliance.r3 = (alliance.r3 || []).filter(u => u !== actorId);
      alliance.r4 = (alliance.r4 || []).filter(u => u !== actorId);
      if (alliance.r5 === actorId) alliance.r5 = null;

      if (!alliance.r5)
        console.warn(`[MembershipModule] Leader removed. Manual TransferLeaderSystem.transferLeadership required.`);

      AllianceIntegrity.validate(alliance);
      await BroadcastModule.announceLeave(allianceId, actorId);
      AllianceService.logAudit(allianceId, { action: "leaveAlliance", userId: actorId });
    });
  }

  // ----------------- PROMOTE MEMBER -----------------
  static async promoteMember(actorId: string, allianceId: string, userId: string): Promise<void> {
    await MutationGate.execute({ actor: actorId, operation: "promoteMember", allianceId }, async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId);

      if (!alliance.r3?.includes(userId)) throw new Error("User is not R3");
      alliance.r4 = alliance.r4 || [];
      alliance.r4.push(userId);
      alliance.r3 = alliance.r3.filter(u => u !== userId);

      AllianceIntegrity.validate(alliance);

      await BroadcastModule.announcePromotion(allianceId, userId, "R4");
      AllianceService.logAudit(allianceId, { action: "promoteMember", actorId, userId, newRole: "R4" });
    });
  }

  // ----------------- DEMOTE MEMBER -----------------
  static async demoteMember(actorId: string, allianceId: string, userId: string): Promise<void> {
    await MutationGate.execute({ actor: actorId, operation: "demoteMember", allianceId }, async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId);

      if (!alliance.r4?.includes(userId)) throw new Error("User is not R4");
      alliance.r3 = alliance.r3 || [];
      alliance.r3.push(userId);
      alliance.r4 = alliance.r4.filter(u => u !== userId);

      AllianceIntegrity.validate(alliance);

      await BroadcastModule.announceDemotion(allianceId, userId, "R3");
      AllianceService.logAudit(allianceId, { action: "demoteMember", actorId, userId, newRole: "R3" });
    });
  }

}