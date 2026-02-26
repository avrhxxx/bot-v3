import { RoleModule } from "../role/RoleModule";
import { BroadcastModule } from "../broadcast/BroadcastModule";
import { MutationGate } from "../../../engine/MutationGate";
import { AllianceManager } from "../../AllianceManager";
import { RulesModule } from "../rules/RulesModule";

/**
 * MODUŁ: MembershipModule
 * WARSTWA: SYSTEM (Członkostwo sojuszu)
 *
 * Odpowiada za:
 * - Dodawanie członków / join request
 * - Akceptację / odrzucenie członków
 * - Promocję / degradację (R3 ↔ R4)
 * - Leave alliance
 * - Synchronizację ról Discord (RoleModule)
 * - Walidację limitów (RulesModule)
 */
export class MembershipModule {

  // ----------------- JOIN REQUEST -----------------
  static async addJoinRequest(userId: string, allianceId: string) {
    await MutationGate.execute({ actor: userId, operation: "addJoinRequest", allianceId }, async () => {
      const alliance = AllianceManager.getAllianceOrThrow(allianceId);
      alliance.pendingJoins = alliance.pendingJoins || [];
      alliance.pendingJoins.push({ userId, requestedAt: Date.now() });

      await BroadcastModule.announceJoinRequest(allianceId, userId);
      AllianceManager.logAudit(allianceId, { action: "addJoinRequest", userId });
    });
  }

  // ----------------- ACCEPT MEMBER -----------------
  static async acceptMember(actorId: string, allianceId: string, userId: string) {
    await MutationGate.execute({ actor: actorId, operation: "acceptMember", allianceId }, async () => {
      const alliance = AllianceManager.getAllianceOrThrow(allianceId);
      alliance.members.r3 = alliance.members.r3 || [];

      RulesModule.validateNewMember(alliance);

      alliance.members.r3.push(userId);

      const guildMember = await AllianceManager.fetchGuildMember(alliance.guildId, userId);
      if (!guildMember) throw new Error("Cannot fetch guild member for new R3.");
      await RoleModule.assignRole(guildMember, alliance.roles.r3RoleId);

      await BroadcastModule.announceJoin(allianceId, userId);
      AllianceManager.logAudit(allianceId, { action: "acceptMember", actorId, userId });
    });
  }

  // ----------------- PROMOTE MEMBER -----------------
  static async promoteMember(actorId: string, allianceId: string, userId: string) {
    await MutationGate.execute({ actor: actorId, operation: "promoteMember", allianceId }, async () => {
      const alliance = AllianceManager.getAllianceOrThrow(allianceId);
      alliance.members.r3 = alliance.members.r3 || [];
      alliance.members.r4 = alliance.members.r4 || [];

      if (!alliance.members.r3.includes(userId)) throw new Error("User is not R3");

      RulesModule.validatePromotion(alliance, "R4");

      alliance.members.r3 = alliance.members.r3.filter(u => u !== userId);
      alliance.members.r4.push(userId);

      const guildMember = await AllianceManager.fetchGuildMember(alliance.guildId, userId);
      if (!guildMember) throw new Error("Cannot fetch guild member for promotion.");
      await RoleModule.promote(guildMember, alliance.roles.r4RoleId, alliance.roles.r3RoleId);

      await BroadcastModule.announcePromotion(allianceId, userId, "R4");
      AllianceManager.logAudit(allianceId, { action: "promoteMember", actorId, userId, newRole: "R4" });
    });
  }

  // ----------------- DEMOTE MEMBER -----------------
  static async demoteMember(actorId: string, allianceId: string, userId: string) {
    await MutationGate.execute({ actor: actorId, operation: "demoteMember", allianceId }, async () => {
      const alliance = AllianceManager.getAllianceOrThrow(allianceId);
      alliance.members.r3 = alliance.members.r3 || [];
      alliance.members.r4 = alliance.members.r4 || [];

      if (!alliance.members.r4.includes(userId)) throw new Error("User is not R4");

      RulesModule.validateDemotion(alliance, "R3");

      alliance.members.r4 = alliance.members.r4.filter(u => u !== userId);
      alliance.members.r3.push(userId);

      const guildMember = await AllianceManager.fetchGuildMember(alliance.guildId, userId);
      if (!guildMember) throw new Error("Cannot fetch guild member for demotion.");
      await RoleModule.demote(guildMember, alliance.roles.r3RoleId, alliance.roles.r4RoleId);

      await BroadcastModule.announceDemotion(allianceId, userId, "R3");
      AllianceManager.logAudit(allianceId, { action: "demoteMember", actorId, userId, newRole: "R3" });
    });
  }

  // ----------------- LEAVE ALLIANCE -----------------
  static async leaveAlliance(actorId: string, allianceId: string, userId: string) {
    await MutationGate.execute({ actor: actorId, operation: "leaveAlliance", allianceId }, async () => {
      const alliance = AllianceManager.getAllianceOrThrow(allianceId);

      ["r3", "r4"].forEach(role => {
        alliance.members[role] = (alliance.members[role] || []).filter(u => u !== userId);
      });

      const guildMember = await AllianceManager.fetchGuildMember(alliance.guildId, userId);
      if (guildMember) {
        const allRoleIds = Object.values(alliance.roles);
        await MutationGate.runAtomically(async () => { await guildMember.roles.remove(allRoleIds); });
      }

      await BroadcastModule.announceLeave(allianceId, userId);
      AllianceManager.logAudit(allianceId, { action: "leaveAlliance", actorId, userId });
    });
  }
}