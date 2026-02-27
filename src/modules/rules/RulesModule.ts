// src/modules/rules/RulesModule.ts
import { AllianceService } from '../../AllianceServices';

export class RulesModule {
  /**
   * Walidacja dołączenia członka do sojuszu.
   */
  static async validateJoin(allianceId: string, memberId: string): Promise<void> {
    const alliance = await AllianceService.getAlliance(allianceId);
    if (!alliance) {
      throw new Error(`[RulesModule] Alliance ${allianceId} does not exist`);
    }

    if (alliance.members.includes(memberId)) {
      throw new Error(`[RulesModule] Member ${memberId} already in alliance ${allianceId}`);
    }

    console.log(`[RulesModule] validateJoin: ${memberId} in ${allianceId}`);
  }

  /**
   * Walidacja zmiany lidera sojuszu.
   */
  static async validateLeaderChange(allianceId: string, newLeaderId: string): Promise<void> {
    const alliance = await AllianceService.getAlliance(allianceId);
    if (!alliance) {
      throw new Error(`[RulesModule] Alliance ${allianceId} does not exist`);
    }

    if (!alliance.members.includes(newLeaderId)) {
      throw new Error(`[RulesModule] Member ${newLeaderId} is not in alliance ${allianceId}`);
    }

    console.log(`[RulesModule] validateLeaderChange: ${newLeaderId} in ${allianceId}`);
  }
}