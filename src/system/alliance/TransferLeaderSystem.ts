/**
 * ============================================
 * FILEPATH: src/system/alliance/TransferLeaderSystem.ts
 * ============================================
 */

import { AllianceService } from "./AllianceService";
import { RoleModule } from "./modules/role/RoleModule";
import { BroadcastModule } from "./modules/broadcast/BroadcastModule";
import { MutationGate } from "../../engine/MutationGate";
import { Alliance } from "./AllianceTypes";

export class TransferLeaderSystem {

  // ----------------- MANUAL TRANSFER (R4 → R5 ONLY) -----------------
  static async transferLeadership(actorId: string, allianceId: string, newLeaderId: string) {
    await MutationGate.runAtomically(async () => {

      const alliance: Alliance = await AllianceService.getAllianceOrThrow(allianceId);

      // ----------------- VALIDATE ACTOR IS CURRENT R5 -----------------
      if (alliance.members.r5 !== actorId) {
        throw new Error("Only the current leader can transfer leadership.");
      }

      // ----------------- VALIDATE TARGET IS R4 -----------------
      const r4List = alliance.members.r4 || [];

      if (!r4List.includes(newLeaderId)) {
        throw new Error("Leadership can only be transferred to an R4 member.");
      }

      const oldLeaderId = alliance.members.r5;

      if (!oldLeaderId) {
        throw new Error("Alliance has no current leader.");
      }

      // ----------------- UPDATE DISCORD ROLES -----------------
      const newLeaderMember = await AllianceService.fetchGuildMember(alliance.guildId, newLeaderId);
      if (!newLeaderMember) {
        throw new Error("Unable to fetch GuildMember for the new leader.");
      }

      const oldLeaderMember = await AllianceService.fetchGuildMember(alliance.guildId, oldLeaderId);
      if (!oldLeaderMember) {
        throw new Error("Unable to fetch GuildMember for the previous leader.");
      }

      // Assign R5 role to new leader
      await RoleModule.assignLeaderRoles(newLeaderMember, alliance.roles);

      // Assign R4 role back to old leader
      await RoleModule.assignR4Roles(oldLeaderMember, alliance.roles);

      // ----------------- UPDATE ALLIANCE STRUCTURE -----------------

      // Remove new leader from R4
      alliance.members.r4 = r4List.filter(id => id !== newLeaderId);

      // Add old leader to R4
      alliance.members.r4.push(oldLeaderId);

      // Set new R5
      alliance.members.r5 = newLeaderId;

      await AllianceService.updateAlliance(alliance);

      // ----------------- BROADCAST + AUDIT -----------------
      await BroadcastModule.announceLeadershipChange(allianceId, actorId, newLeaderId);

      await AllianceService.logAudit(allianceId, {
        action: "transferLeadership",
        actorId,
        previousLeaderId: oldLeaderId,
        newLeaderId
      });
    });
  }

  // ----------------- LEADER VALIDATION -----------------
  static validateLeadership(alliance: Alliance) {
    const leaderId = alliance.members.r5;

    if (!leaderId) {
      throw new Error("Alliance must have exactly one leader.");
    }

    const allMembers = [
      ...(alliance.members.r3 || []),
      ...(alliance.members.r4 || []),
      leaderId
    ];

    if (!allMembers.includes(leaderId)) {
      throw new Error("Invalid leader state: leader is not listed as a member.");
    }
  }
}