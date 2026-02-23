// File path: src/system/alliance/modules/MembershipModule.ts

import { AllianceService } from "../AllianceService";
import { RoleModule, AllianceRoles } from "../RoleModule";
import { BroadcastModule } from "../BroadcastModule";
import { TransferLeaderSystem } from "../TransferLeaderSystem";
import { AllianceIntegrity } from "../integrity/AllianceIntegrity";
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

  // ----------------- JOIN -----------------
  static async requestJoin(actorId: string, allianceId: string): Promise<void> {
    await MutationGate.runAtomically(async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId) as any;

      alliance.pendingJoins = alliance.pendingJoins || [];
      alliance.pendingJoins.push({ userId: actorId, requestedAt: Date.now() });

      AllianceService.logAudit(allianceId, { action: "requestJoin", userId: actorId });
    });
  }

  static async approveJoin(actorId: string, allianceId: string, userId: string): Promise<void> {
    await MutationGate.runAtomically(async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId) as any;
      const roles: AllianceRoles = alliance.roles || {} as any;

      // Dodanie członka
      alliance.members = alliance.members || [];
      alliance.members.push({ userId, role: "R3" });

      alliance.pendingJoins = (alliance.pendingJoins || []).filter(j => j.userId !== userId);

      AllianceIntegrity.validate(alliance);
      await BroadcastModule.announceJoin(allianceId, userId);

      AllianceService.logAudit(allianceId, { action: "approveJoin", actorId, userId });
    });
  }

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

  // ----------------- LEADERSHIP -----------------
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