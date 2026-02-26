/**
 * ============================================
 * FILE: src/system/alliance/modules/membership/MembershipModule.ts
 * MODULE: MembershipModule
 * LAYER: SYSTEM (Alliance Membership Management)
 * ============================================
 *
 * RESPONSIBILITY:
 * - Manage join requests, accept/deny members
 * - Promote/Demote members
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
  /**
   * Dodaje żądanie dołączenia użytkownika do sojuszu
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

  /**
   * Akceptuje nowego członka R3
   */
  static async acceptMember(actorId: string, allianceId: string, userId: string) {
    await MutationGate.execute({ actor: actorId, operation: "acceptMember", allianceId }, async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId);
      alliance.members.r3 = alliance.members.r3 || [];
      alliance.members.r3.push(userId);

      // Walidacja limitów
      RulesModule.validateNewMember(alliance);

      // ----------------- SYNC ROLE DISCORD -----------------
      const guildMember = await AllianceService.fetchGuildMember(alliance.guildId, userId);
      if (!guildMember) throw new Error("Cannot fetch guild member for new R3.");
      await RoleModule.assignRole(guildMember, alliance.roles.r3RoleId);

      // Broadcast i audyt
      await BroadcastModule.announceJoin(allianceId, userId);
      AllianceService.logAudit(allianceId, { action: "acceptMember", actorId, userId });
    });
  }

  /**
   * Promuje członka R3 → R4
   */
  static async promoteMember(actorId: string, allianceId: string, userId: string) {
    await MutationGate.execute({ actor: actorId, operation: "promoteMember", allianceId }, async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId);
      alliance.members.r3 = alliance.members.r3 || [];
      alliance.members.r4 = alliance.members.r4 || [];

      if (!alliance.members.r3.includes(userId)) throw new Error("User is not R3");

      // Walidacja
      RulesModule.validatePromotion(alliance, "R4");

      // Aktualizacja członków
      alliance.members.r3 = alliance.members.r3.filter(u => u !== userId);
      alliance.members.r4.push(userId);

      // ----------------- SYNC ROLE DISCORD -----------------
      const guildMember = await AllianceService.fetchGuildMember(alliance.guildId, userId);
      if (!guildMember) throw new Error("Cannot fetch guild member for promotion.");
      await RoleModule.promote(guildMember, alliance.roles.r4RoleId, alliance.roles.r3RoleId);

      // Broadcast i audyt
      await BroadcastModule.announcePromotion(allianceId, userId, "R4");
      AllianceService.logAudit(allianceId, { action: "promoteMember", actorId, userId, newRole: "R4" });
    });
  }

  /**
   * Demote członka R4 → R3
   */
  static async demoteMember(actorId: string, allianceId: string, userId: string) {
    await MutationGate.execute({ actor: actorId, operation: "demoteMember", allianceId }, async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId);
      alliance.members.r3 = alliance.members.r3 || [];
      alliance.members.r4 = alliance.members.r4 || [];

      if (!alliance.members.r4.includes(userId)) throw new Error("User is not R4");

      // Walidacja
      RulesModule.validateDemotion(alliance, "R3");

      // Aktualizacja członków
      alliance.members.r4 = alliance.members.r4.filter(u => u !== userId);
      alliance.members.r3.push(userId);

      // ----------------- SYNC ROLE DISCORD -----------------
      const guildMember = await AllianceService.fetchGuildMember(alliance.guildId, userId);
      if (!guildMember) throw new Error("Cannot fetch guild member for demotion.");
      await RoleModule.demote(guildMember, alliance.roles.r3RoleId, alliance.roles.r4RoleId);

      // Broadcast i audyt
      await BroadcastModule.announceDemotion(allianceId, userId, "R3");
      AllianceService.logAudit(allianceId, { action: "demoteMember", actorId, userId, newRole: "R3" });
    });
  }
}

/**
 * ============================================
 * FILEPATH: src/system/alliance/modules/membership/MembershipModule.ts
 * ============================================
 */