/**
 * ============================================
 * FILE: src/system/alliance/orchestrator/AllianceOrchestrator.ts
 * LAYER: APPLICATION (Orchestration Layer)
 * ============================================
 *
 * RESPONSIBILITIES:
 * - Orchestrate modules into atomic operations
 * - Invoke MutationGate
 * - No domain logic (coordination only)
 *
 * ============================================
 */

import { GuildMember } from "discord.js"; // Discord type
import { MembershipModule } from "../modules/membership/MembershipModule";
import { BroadcastModule } from "../modules/broadcast/BroadcastModule";
import { TransferLeaderSystem } from "../TransferLeaderSystem";
import { AllianceService } from "../AllianceService";
import { MutationGate } from "../../engine/MutationGate";

export class AllianceOrchestrator {

  // ----------------- JOIN REQUEST -----------------
  static async join(actor: GuildMember, allianceId: string) {
    await MutationGate.runAtomically(async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId);

      const totalMembers = (alliance.members.r5 ? 1 : 0)
                         + (alliance.members.r4?.length || 0)
                         + (alliance.members.r3?.length || 0);
      if (totalMembers >= 100) throw new Error("Alliance is full – cannot submit join request");

      await MembershipModule.addJoinRequest(actor.id, allianceId);

      await BroadcastModule.announceJoinRequest(
        allianceId,
        actor.id,
        [alliance.roles.r4RoleId, alliance.roles.r5RoleId]
      );
    });
  }

  // ----------------- APPROVE JOIN -----------------
  static async approveJoin(actor: GuildMember, allianceId: string, userId: string) {
    await MutationGate.runAtomically(async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId);

      const totalMembers = (alliance.members.r5 ? 1 : 0)
                         + (alliance.members.r4?.length || 0)
                         + (alliance.members.r3?.length || 0);
      if (totalMembers >= 100) throw new Error("Alliance has reached maximum members");

      await MembershipModule.acceptMember(actor.id, allianceId, userId);

      await BroadcastModule.announceJoin(
        allianceId,
        userId,
        [alliance.roles.identityRoleId]
      );
    });
  }

  // ----------------- DENY JOIN -----------------
  static async denyJoin(actor: GuildMember, allianceId: string, userId: string) {
    await MutationGate.runAtomically(async () => {
      await MembershipModule.denyMember(actor.id, allianceId, userId);
    });
  }

  // ----------------- LEAVE -----------------
  static async leave(actor: GuildMember, allianceId: string, userId: string) {
    await MutationGate.runAtomically(async () => {
      await MembershipModule.leaveAlliance(actor.id, allianceId, userId);

      const alliance = AllianceService.getAllianceOrThrow(allianceId);
      await BroadcastModule.announceLeave(
        allianceId,
        userId,
        [alliance.roles.identityRoleId]
      );
    });
  }

  // ----------------- PROMOTE -----------------
  static async promote(actor: GuildMember, allianceId: string, userId: string) {
    await MutationGate.runAtomically(async () => {
      await MembershipModule.promoteMember(actor.id, allianceId, userId);

      await BroadcastModule.announcePromotion(
        allianceId,
        userId,
        "R4"
      );
    });
  }

  // ----------------- DEMOTE -----------------
  static async demote(actor: GuildMember, allianceId: string, userId: string) {
    await MutationGate.runAtomically(async () => {
      await MembershipModule.demoteMember(actor.id, allianceId, userId);

      await BroadcastModule.announceDemotion(
        allianceId,
        userId,
        "R3"
      );
    });
  }

  // ----------------- TRANSFER LEADER -----------------
  static async transferLeader(actor: GuildMember, allianceId: string, newLeaderId: string) {
    await MutationGate.runAtomically(async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId);
      const oldLeaderId = alliance.members.r5?.id;

      await TransferLeaderSystem.transferLeadership(actor.id, allianceId, newLeaderId);

      await BroadcastModule.announceLeadershipChange(
        allianceId,
        oldLeaderId!,
        newLeaderId,
        alliance.roles.identityRoleId
      );
    });
  }

  // ----------------- UPDATE TAG -----------------
  static async updateTag(actor: GuildMember, allianceId: string, newTag: string) {
    await MutationGate.runAtomically(async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId);
      const oldTag = alliance.tag;

      await AllianceService.updateTag(actor.id, allianceId, newTag);

      await BroadcastModule.announceTagChange(
        allianceId,
        oldTag,
        newTag,
        alliance.roles.identityRoleId
      );
    });
  }

  // ----------------- UPDATE NAME -----------------
  static async updateName(actor: GuildMember, allianceId: string, newName: string) {
    await MutationGate.runAtomically(async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId);
      const oldName = alliance.name;

      await AllianceService.updateName(actor.id, allianceId, newName);

      await BroadcastModule.announceNameChange(
        allianceId,
        oldName,
        newName,
        alliance.roles.identityRoleId
      );
    });
  }
}