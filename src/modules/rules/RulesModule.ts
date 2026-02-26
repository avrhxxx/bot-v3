// src/modules/rules/RulesModule.ts
import { AllianceService, Alliance } from "../../AllianceServices";

export class RulesModule {
  static async validateJoin(allianceId: string, memberId: string): Promise<void> {
    const alliance: Alliance | null = await AllianceService.getAlliance(allianceId);
    if (!alliance) throw new Error(`[RulesModule] Alliance ${allianceId} does not exist`);

    if (alliance.members.includes(memberId)) {
      throw new Error(`[RulesModule] Member ${memberId} already in alliance ${allianceId}`);
    }

    console.log(`[RulesModule] validateJoin: ${memberId} in ${allianceId}`);
  }

  static async validateLeaderChange(allianceId: string, newLeaderId: string): Promise<void> {
    const alliance: Alliance | null = await AllianceService.getAlliance(allianceId);
    if (!alliance) throw new Error(`[RulesModule] Alliance ${allianceId} does not exist`);

    if (!alliance.members.includes(newLeaderId)) {
      throw new Error(`[RulesModule] New leader ${newLeaderId} is not a member of ${allianceId}`);
    }

    console.log(`[RulesModule] validateLeaderChange: ${newLeaderId} in ${allianceId}`);
  }
}