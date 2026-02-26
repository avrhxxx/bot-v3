import { AllianceManager } from "../../AllianceManager";
import { RoleModule } from "../role/RoleModule";
import { BroadcastModule } from "../broadcast/BroadcastModule";
import { MutationGate } from "../../../engine/MutationGate";
import { RulesModule } from "../rules/RulesModule";

/**
 * MODUŁ: TransferLeaderModule
 * WARSTWA: SYSTEM (Przekazanie lidera)
 *
 * Odpowiada za:
 * - Transfer leadership R5 ↔ R4
 * - Set leader administracyjnie
 * - Aktualizację ról Discord
 * - Broadcast zmian lidera
 */
export class TransferLeaderModule {
  static async transferLeadership(actorId: string, allianceId: string, newLeaderId: string) {
    await MutationGate.runAtomically(async () => {
      const alliance = AllianceManager.getAllianceOrThrow(allianceId);

      if (alliance.members.r5 !== actorId) throw new Error("Only current leader can transfer leadership.");
      if (!alliance.members.r4.includes(newLeaderId)) throw new Error("New leader must be R4.");

      const oldLeaderMember = await AllianceManager.fetchGuildMember(alliance.guildId, actorId);
      const newLeaderMember = await AllianceManager.fetchGuildMember(alliance.guildId, newLeaderId);

      if (!oldLeaderMember || !newLeaderMember) throw new Error("Cannot fetch guild members.");

      await RoleModule.assignLeaderRoles(newLeaderMember, alliance.roles);
      await RoleModule.assignR4Roles(oldLeaderMember, alliance.roles);

      alliance.members.r4 = alliance.members.r4.filter(id => id !== newLeaderId);
      alliance.members.r4.push(actorId);
      alliance.members.r5 = newLeaderId;

      RulesModule.validateLeader(alliance);

      await BroadcastModule.announceLeadershipChange(allianceId, actorId, newLeaderId, alliance.roles.identityRoleId);
      AllianceManager.logAudit(allianceId, { action: "transferLeadership", actorId, previousLeaderId: actorId, newLeaderId });
    });
  }

  static async setLeader(actorId: string, allianceId: string, newLeaderId: string) {
    await MutationGate.runAtomically(async () => {
      const alliance = AllianceManager.getAllianceOrThrow(allianceId);
      const oldLeaderId = alliance.members.r5;

      const newLeaderMember = await AllianceManager.fetchGuildMember(alliance.guildId, newLeaderId);
      if (!newLeaderMember) throw new Error("Cannot fetch new leader.");

      if (!oldLeaderId) {
        await RoleModule.assignLeaderRoles(newLeaderMember, alliance.roles);
        alliance.members.r5 = newLeaderId;
      } else {
        if (!alliance.members.r4.includes(newLeaderId)) throw new Error("New leader must be R4.");

        const oldLeaderMember = await AllianceManager.fetchGuildMember(alliance.guildId, oldLeaderId);
        if (!oldLeaderMember) throw new Error("Cannot fetch old leader.");

        await RoleModule.assignLeaderRoles(newLeaderMember, alliance.roles);
        await RoleModule.assignR4Roles(oldLeaderMember, alliance.roles);

        alliance.members.r4 = alliance.members.r4.filter(id => id !== newLeaderId);
        alliance.members.r4.push(oldLeaderId);
        alliance.members.r5 = newLeaderId;
      }

      RulesModule.validateLeader(alliance);

      await BroadcastModule.announceLeadershipChange(allianceId, oldLeaderId || "", newLeaderId, alliance.roles.identityRoleId);
      AllianceManager.logAudit(allianceId, { action: "setLeader", actorId, previousLeaderId: oldLeaderId, newLeaderId });
    });
  }
}