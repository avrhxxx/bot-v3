/**
 * ============================================
 * FILE: src/system/alliance/orchestrator/AllianceOrchestrator.ts
 * LAYER: APPLICATION (Orchestration Layer)
 * ============================================
 *
 * ODPOWIEDZIALNOŚĆ:
 * - Spinanie modułów w operacje atomowe
 * - Wywoływanie MutationGate
 * - Brak logiki domenowej (tylko koordynacja)
 *
 * ZASADA:
 * - Tutaj wykonujemy runAtomically
 * - Moduły wykonują czystą logikę
 *
 * ============================================
 */

import { MembershipModule } from "../modules/membership/MembershipModule";
import { RoleModule } from "../modules/role/RoleModule";
import { BroadcastModule } from "../modules/broadcast/BroadcastModule";
import { TransferLeaderSystem } from "../TransferLeaderSystem";
import { AllianceService } from "../AllianceService";
import { MutationGate } from "../../engine/MutationGate";

export class AllianceOrchestrator {

  // ----------------- JOIN REQUEST -----------------
  static async join(actorId: string, allianceId: string) {
    await MutationGate.runAtomically(async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId);

      await MembershipModule.requestJoin(actorId, allianceId);

      // Staff-room → ping tylko R4 + R5
      await BroadcastModule.announceJoinRequest(
        allianceId,
        actorId,
        [alliance.roles.r4RoleId, alliance.roles.r5RoleId]
      );
    });
  }

  // ----------------- APPROVE JOIN -----------------
  static async approveJoin(actorId: string, allianceId: string, userId: string) {
    await MutationGate.runAtomically(async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId);

      await MembershipModule.approveJoin(actorId, allianceId, userId);

      // Publiczne → ping identity role
      await BroadcastModule.announceJoin(
        allianceId,
        userId,
        [alliance.roles.identityRoleId]
      );
    });
  }

  // ----------------- LEAVE -----------------
  static async leave(actorId: string, allianceId: string) {
    await MutationGate.runAtomically(async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId);

      await MembershipModule.leaveAlliance(actorId, allianceId);

      await BroadcastModule.announceLeave(
        allianceId,
        actorId,
        [alliance.roles.identityRoleId]
      );
    });
  }

  // ----------------- PROMOTE -----------------
  static async promote(actorId: string, allianceId: string, userId: string) {
    await MutationGate.runAtomically(async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId);

      await RoleModule.promote(userId, allianceId, alliance.roles);

      await BroadcastModule.announcePromotion(
        allianceId,
        userId,
        "R4",
        [alliance.roles.identityRoleId]
      );
    });
  }

  // ----------------- DEMOTE -----------------
  static async demote(actorId: string, allianceId: string, userId: string) {
    await MutationGate.runAtomically(async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId);

      await RoleModule.demote(userId, allianceId, alliance.roles);

      await BroadcastModule.announceDemotion(
        allianceId,
        userId,
        "R3",
        [alliance.roles.identityRoleId]
      );
    });
  }

  // ----------------- TRANSFER LEADER -----------------
  static async transferLeader(actorId: string, allianceId: string, newLeaderId: string) {
    await MutationGate.runAtomically(async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId);

      const oldLeaderId = alliance.members.r5;

      await TransferLeaderSystem.transferLeadership(actorId, allianceId, newLeaderId);

      await BroadcastModule.announceLeadershipChange(
        allianceId,
        oldLeaderId!,
        newLeaderId,
        alliance.roles.identityRoleId
      );
    });
  }

  // ----------------- UPDATE TAG -----------------
  static async updateTag(actorId: string, allianceId: string, newTag: string) {
    await MutationGate.runAtomically(async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId);
      const oldTag = alliance.tag;

      await AllianceService.updateTag(actorId, allianceId, newTag);

      await BroadcastModule.announceTagChange(
        allianceId,
        oldTag,
        newTag,
        alliance.roles.identityRoleId
      );
    });
  }

  // ----------------- UPDATE NAME -----------------
  static async updateName(actorId: string, allianceId: string, newName: string) {
    await MutationGate.runAtomically(async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId);
      const oldName = alliance.name;

      await AllianceService.updateName(actorId, allianceId, newName);

      await BroadcastModule.announceNameChange(
        allianceId,
        oldName,
        newName,
        alliance.roles.identityRoleId
      );
    });
  }
}