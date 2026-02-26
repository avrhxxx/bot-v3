// src/modules/rules/RulesModule.ts
import { AllianceService } from "../../AllianceService";

export class RulesModule {
  static validateJoin(allianceId: string, memberId: string) {
    console.log(`[RulesModule] validateJoin: ${memberId} in ${allianceId}`);
  }

  static validateLeaderChange(allianceId: string, newLeaderId: string) {
    console.log(`[RulesModule] validateLeaderChange: ${newLeaderId} in ${allianceId}`);
  }
}