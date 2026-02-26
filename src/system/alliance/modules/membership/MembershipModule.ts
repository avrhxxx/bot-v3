/**
 * ============================================
 * MODULE: MembershipModule
 * FILE: src/system/alliance/modules/membership/MembershipModule.ts
 * LAYER: SYSTEM (Alliance Membership Management)
 * ============================================
 *
 * RESPONSIBILITY:
 * - Manage join requests, accept/deny members
 * - Promote/Demote members (R3 ↔ R4)
 * - Leave alliance
 * - Use RulesModule for validations
 * - Synchronize Discord roles with RoleModule
 *
 * DEPENDENCIES:
 * - AllianceService (fetch alliance data)
 * - RoleModule (Discord role updates)
 * - BroadcastModule (announcements)
 * - MutationGate (atomic operations)
 * - RulesModule (enforce limits)
 * - ChannelModule.getAllMembers for member count consistency
 *
 * ============================================
 */

import { RoleModule } from "../role/RoleModule";
import { BroadcastModule } from "../broadcast/BroadcastModule";
import { MutationGate } from "../../../engine/MutationGate";
import { AllianceService } from "../../AllianceService";
import { RulesModule } from "../rules/RulesModule";
import { ChannelModule } from "../channel/ChannelModule";

export class MembershipModule {
  // ----------------- JOIN REQUEST -----------------
  /**
   * Add join request for user
   */
  static async addJoinRequest(userId: string, allianceId: string) {
    await MutationGate.execute({ actor: userId, operation: "addJoinRequest", allianceId }, async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId);
      alliance.pendingJoins = alliance.pendingJoins || [];
      alliance.pendingJoins.push({ userId, requestedAt: Date.now() });

      await BroadcastModule.announceJoinRequest(allianceId, userId);
      AllianceService.logAudit(allianceId, { action: "addJoinRequest", userId });
    });
  }

  // ----------------- ACCEPT MEMBER -----------------
  /**
   * Accept new R3 member
   */
  static async acceptMember(actorId: string, allianceId: string, userId: string) {
    await MutationGate.execute({ actor: actorId, operation: "acceptMember", allianceId }, async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId);
      alliance.members.r3 = alliance.members.r3 || [];
      alliance.members.r3.push(userId);

      // Validate limits
      RulesModule.validateNewMember(alliance);

      // ----------------- SYNC ROLE DISCORD -----------------
      const guildMember = await AllianceService.fetchGuildMember(alliance.guildId, userId);
      if (!guildMember) throw new Error("Cannot fetch guild member for new R3.");
      await RoleModule.assignRole(guildMember, alliance.roles.r3RoleId);

      // Broadcast & Audit
      await BroadcastModule.announceJoin(allianceId, userId);
      AllianceService.logAudit(allianceId, { action: "acceptMember", actorId, userId });
    });
  }

  // ----------------- PROMOTE MEMBER -----------------
  /**
   * Promote R3 → R4
   */
  static async promoteMember(actorId: string, allianceId: string, userId: string) {
    await MutationGate.execute({ actor: actorId, operation: "promoteMember", allianceId }, async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId);
      alliance.members.r3 = alliance.members.r3 || [];
      alliance.members.r4 = alliance.members.r4 || [];

      if (!alliance.members.r3.includes(userId)) throw new Error("User is not R3");

      // Validate promotion
      RulesModule.validatePromotion(alliance, "R4");

      // Update members
      alliance.members.r3 = alliance.members.r3.filter(u => u !== userId);
      alliance.members.r4.push(userId);

      // ----------------- SYNC ROLE DISCORD -----------------
      const guildMember = await AllianceService.fetchGuildMember(alliance.guildId, userId);
      if (!guildMember) throw new Error("Cannot fetch guild member for promotion.");
      await RoleModule.promote(guildMember, alliance.roles.r4RoleId, alliance.roles.r3RoleId);

      // Broadcast & Audit
      await BroadcastModule.announcePromotion(allianceId, userId, "R4");
      AllianceService.logAudit(allianceId, { action: "promoteMember", actorId, userId, newRole: "R4" });
    });
  }

  // ----------------- DEMOTE MEMBER -----------------
  /**
   * Demote R4 → R3
   */
  static async demoteMember(actorId: string, allianceId: string, userId: string) {
    await MutationGate.execute({ actor: actorId, operation: "demoteMember", allianceId }, async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId);
      alliance.members.r3 = alliance.members.r3 || [];
      alliance.members.r4 = alliance.members.r4 || [];

      if (!alliance.members.r4.includes(userId)) throw new Error("User is not R4");

      // Validate demotion
      RulesModule.validateDemotion(alliance, "R3");

      // Update members
      alliance.members.r4 = alliance.members.r4.filter(u => u !== userId);
      alliance.members.r3.push(userId);

      // ----------------- SYNC ROLE DISCORD -----------------
      const guildMember = await AllianceService.fetchGuildMember(alliance.guildId, userId);
      if (!guildMember) throw new Error("Cannot fetch guild member for demotion.");
      await RoleModule.demote(guildMember, alliance.roles.r3RoleId, alliance.roles.r4RoleId);

      // Broadcast & Audit
      await BroadcastModule.announceDemotion(allianceId, userId, "R3");
      AllianceService.logAudit(allianceId, { action: "demoteMember", actorId, userId, newRole: "R3" });
    });
  }

  // ----------------- LEAVE ALLIANCE -----------------
  /**
   * Remove member from alliance
   */
  static async leaveAlliance(actorId: string, allianceId: string, userId: string) {
    await MutationGate.execute({ actor: actorId, operation: "leaveAlliance", allianceId }, async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId);

      // Remove user from any role array
      ["r3", "r4"].forEach(role => {
        alliance.members[role] = (alliance.members[role] || []).filter(u => u !== userId);
      });

      // TODO: optionally remove R5 if leaving leader (handled via TransferLeaderModule)

      // ----------------- SYNC ROLE DISCORD -----------------
      const guildMember = await AllianceService.fetchGuildMember(alliance.guildId, userId);
      if (guildMember) {
        const allRoleIds = Object.values(alliance.roles);
        await MutationGate.runAtomically(async () => {
          await guildMember.roles.remove(allRoleIds);
        });
      }

      // Broadcast & Audit
      await BroadcastModule.announceLeave(allianceId, userId);
      AllianceService.logAudit(allianceId, { action: "leaveAlliance", actorId, userId });
    });
  }
}

/**
 * ============================================
 * FILEPATH: src/system/alliance/modules/membership/MembershipModule.ts
 * ============================================
 */