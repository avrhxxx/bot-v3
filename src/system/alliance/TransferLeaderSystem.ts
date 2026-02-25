/**
 * ============================================
 * FILEPATH: src/system/alliance/TransferLeaderSystem.ts
 * LAYER: SYSTEM (Leadership Domain Logic)
 * ============================================
 *
 * RESPONSIBILITIES:
 * - Manual leadership transfer within the alliance (R4 → R5)
 * - Admin/owner can set leader (any Discord user if no leader, or R4 if leader exists)
 * - Broadcasts and audit logging for leadership changes
 *
 * DEPENDENCIES:
 * - AllianceService (fetch/update alliance, audit logs)
 * - RoleModule (assign roles in Discord)
 * - BroadcastModule (announce leadership changes)
 * - MutationGate (atomic operations)
 *
 * NOTES:
 * - Transfers respect role limits (R4 → R5 only)
 * - setLeader can override limits for setup or emergency
 *
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

      // Validate that the actor is the current leader
      if (alliance.members.r5 !== actorId) {
        throw new Error("Only the current leader can transfer leadership.");
      }

      // Validate the new leader is R4
      const r4List = alliance.members.r4 || [];
      if (!r4List.includes(newLeaderId)) {
        throw new Error("Leadership can only be transferred to an R4 member.");
      }

      const oldLeaderId = alliance.members.r5;
      if (!oldLeaderId) throw new Error("Alliance has no current leader.");

      // ----------------- UPDATE DISCORD ROLES -----------------
      const newLeaderMember = await AllianceService.fetchGuildMember(alliance.guildId, newLeaderId);
      if (!newLeaderMember) throw new Error("Unable to fetch GuildMember for the new leader.");

      const oldLeaderMember = await AllianceService.fetchGuildMember(alliance.guildId, oldLeaderId);
      if (!oldLeaderMember) throw new Error("Unable to fetch GuildMember for the previous leader.");

      // Assign R5 role to new leader
      await RoleModule.assignLeaderRoles(newLeaderMember, alliance.roles);

      // Assign R4 role back to old leader
      await RoleModule.assignR4Roles(oldLeaderMember, alliance.roles);

      // ----------------- UPDATE ALLIANCE STRUCTURE -----------------
      alliance.members.r4 = r4List.filter(id => id !== newLeaderId);
      alliance.members.r4.push(oldLeaderId);
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

  // ----------------- ADMIN / OWNER SET LEADER -----------------
  static async setLeader(actorId: string, allianceId: string, newLeaderId: string) {
    await MutationGate.runAtomically(async () => {
      const alliance: Alliance = await AllianceService.getAllianceOrThrow(allianceId);
      const oldLeaderId = alliance.members.r5;

      // ----------------- FETCH NEW LEADER MEMBER -----------------
      const newLeaderMember = await AllianceService.fetchGuildMember(alliance.guildId, newLeaderId);
      if (!newLeaderMember) {
        throw new Error("Unable to fetch GuildMember for the new leader.");
      }

      // ----------------- CASE 1: NO CURRENT LEADER -----------------
      if (!oldLeaderId) {
        // Any Discord user can be leader (sojusz just created)
        await RoleModule.assignLeaderRoles(newLeaderMember, alliance.roles);
        alliance.members.r5 = newLeaderId;
        await AllianceService.updateAlliance(alliance);

        await BroadcastModule.announceLeadershipChange(allianceId, actorId, newLeaderId);
        await AllianceService.logAudit(allianceId, {
          action: "setLeader",
          actorId,
          newLeaderId
        });
        return;
      }

      // ----------------- CASE 2: CURRENT LEADER EXISTS -----------------
      // New leader must be an R4 member
      const r4List = alliance.members.r4 || [];
      if (!r4List.includes(newLeaderId)) {
        throw new Error("New leader must be an R4 member.");
      }

      // Fetch old leader
      const oldLeaderMember = await AllianceService.fetchGuildMember(alliance.guildId, oldLeaderId);
      if (!oldLeaderMember) throw new Error("Unable to fetch GuildMember for the previous leader.");

      // Assign R5 to new leader
      await RoleModule.assignLeaderRoles(newLeaderMember, alliance.roles);

      // Demote old leader to R4
      await RoleModule.assignR4Roles(oldLeaderMember, alliance.roles);

      // ----------------- UPDATE ALLIANCE STRUCTURE -----------------
      alliance.members.r4 = r4List.filter(id => id !== newLeaderId);
      alliance.members.r4.push(oldLeaderId);
      alliance.members.r5 = newLeaderId;

      await AllianceService.updateAlliance(alliance);

      // ----------------- BROADCAST + AUDIT -----------------
      await BroadcastModule.announceLeadershipChange(allianceId, actorId, newLeaderId);
      await AllianceService.logAudit(allianceId, {
        action: "setLeader",
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