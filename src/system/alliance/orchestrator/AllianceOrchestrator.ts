// src/system/alliance/orchestrator/AllianceOrchestrator.ts

import { MembershipModule } from "../modules/membership/MembershipModule";
import { RoleModule } from "../modules/role/RoleModule";
import { BroadcastModule } from "../modules/broadcast/BroadcastModule";
import { TransferLeaderSystem } from "../TransferLeaderSystem";
import { AllianceService } from "../AllianceService";
import { MutationGate } from "../../engine/MutationGate";

export class AllianceOrchestrator {
  static async join(actorId: string, allianceId: string) {
    await MutationGate.runAtomically(async () => {
      await MembershipModule.requestJoin(actorId, allianceId);
    });
  }

  static async approveJoin(actorId: string, allianceId: string, userId: string) {
    await MutationGate.runAtomically(async () => {
      await MembershipModule.approveJoin(actorId, allianceId, userId);
    });
  }

  static async leave(actorId: string, allianceId: string) {
    await MutationGate.runAtomically(async () => {
      await MembershipModule.leaveAlliance(actorId, allianceId);
    });
  }

  static async promote(actorId: string, allianceId: string, userId: string) {
    await MutationGate.runAtomically(async () => {
      await RoleModule.promote(actorId, allianceId, userId);
      await BroadcastModule.announcePromotion(allianceId, userId);
    });
  }

  static async demote(actorId: string, allianceId: string, userId: string) {
    await MutationGate.runAtomically(async () => {
      await RoleModule.demote(actorId, allianceId, userId);
      await BroadcastModule.announceDemotion(allianceId, userId);
    });
  }

  static async transferLeader(actorId: string, allianceId: string, newLeaderId: string) {
    await MutationGate.runAtomically(async () => {
      await TransferLeaderSystem.transferLeadership(actorId, allianceId, newLeaderId);
    });
  }

  static async updateTag(actorId: string, allianceId: string, newTag: string) {
    await MutationGate.runAtomically(async () => {
      await AllianceService.updateTag(actorId, allianceId, newTag);
      await BroadcastModule.announceTagChange(allianceId, newTag);
    });
  }

  static async updateName(actorId: string, allianceId: string, newName: string) {
    await MutationGate.runAtomically(async () => {
      await AllianceService.updateName(actorId, allianceId, newName);
      await BroadcastModule.announceNameChange(allianceId, newName);
    });
  }
}