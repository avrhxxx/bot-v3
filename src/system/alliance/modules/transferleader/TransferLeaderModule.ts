/**
 * ============================================
 * MODULE: TransferLeaderModule
 * FILE: src/system/alliance/modules/transferleader/TransferLeaderModule.ts
 * LAYER: SYSTEM (Alliance Leadership)
 * ============================================
 *
 * RESPONSIBILITY:
 * - Transfer leader (R4 → R5)
 * - Set leader (Admin/Owner)
 * - Validate leadership using RulesModule
 * - Assign roles using RoleModule
 * - Broadcast leadership changes
 *
 * DEPENDENCIES:
 * - AllianceService
 * - RoleModule
 * - BroadcastModule
 * - RulesModule
 * - MutationGate
 *
 * ============================================
 */

import { AllianceService } from "../../AllianceService";
import { RoleModule } from "../role/RoleModule";
import { BroadcastModule } from "../broadcast/BroadcastModule";
import { MutationGate } from "../../../engine/MutationGate";
import { RulesModule } from "../rules/RulesModule";
import { Alliance } from "../../AllianceTypes";

export class TransferLeaderModule {
  static async transferLeadership(actorId: string, allianceId: string, newLeaderId: string) {
    await MutationGate.runAtomically(async () => {
      const alliance: Alliance = AllianceService.getAllianceOrThrow(allianceId);

      if (alliance.members.r5 !== actorId) throw new Error("Only the current leader can transfer leadership.");
      if (!alliance.members.r4.includes(newLeaderId)) throw new Error("New leader must be R4.");

      const oldLeaderId = alliance.members.r5!;
      const oldLeaderMember = await AllianceService.fetchGuildMember(alliance.guildId, oldLeaderId);
      const newLeaderMember = await AllianceService.fetchGuildMember(alliance.guildId, newLeaderId);

      await RoleModule.assignLeaderRoles(newLeaderMember!, alliance.roles);
      await RoleModule.assignR4Roles(oldLeaderMember!, alliance.roles);

      alliance.members.r4 = alliance.members.r4.filter(id => id !== newLeaderId);
      alliance.members.r4.push(oldLeaderId);
      alliance.members.r5 = newLeaderId;

      RulesModule.validateLeader(alliance);

      await BroadcastModule.announceLeadershipChange(allianceId, oldLeaderId, newLeaderId, alliance.roles.identityRoleId);
      AllianceService.logAudit(allianceId, { action: "transferLeadership", actorId, previousLeaderId: oldLeaderId, newLeaderId });
    });
  }

  static async setLeader(actorId: string, allianceId: string, newLeaderId: string) {
    await MutationGate.runAtomically(async () => {
      const alliance: Alliance = AllianceService.getAllianceOrThrow(allianceId);
      const oldLeaderId = alliance.members.r5;

      const newLeaderMember = await AllianceService.fetchGuildMember(alliance.guildId, newLeaderId);
      if (!newLeaderMember) throw new Error("Cannot fetch new leader.");

      if (!oldLeaderId) {
        await RoleModule.assignLeaderRoles(newLeaderMember!, alliance.roles);
        alliance.members.r5 = newLeaderId;
      } else {
        if (!alliance.members.r4.includes(newLeaderId)) throw new Error("New leader must be R4.");

        const oldLeaderMember = await AllianceService.fetchGuildMember(alliance.guildId, oldLeaderId);
        await RoleModule.assignLeaderRoles(newLeaderMember!, alliance.roles);
        await RoleModule.assignR4Roles(oldLeaderMember!, alliance.roles);

        alliance.members.r4 = alliance.members.r4.filter(id => id !== newLeaderId);
        alliance.members.r4.push(oldLeaderId);
        alliance.members.r5 = newLeaderId;
      }

      RulesModule.validateLeader(alliance);

      await BroadcastModule.announceLeadershipChange(allianceId, oldLeaderId || "", newLeaderId, alliance.roles.identityRoleId);
      AllianceService.logAudit(allianceId, { action: "setLeader", actorId, previousLeaderId: oldLeaderId, newLeaderId });
    });
  }
}