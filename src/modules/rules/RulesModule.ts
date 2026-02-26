// src/modules/rules/RulesModule.ts
export class RulesModule {
  static validateJoin(allianceId: string, memberId: string) {
    console.log(`[RulesModule] validateJoin ${memberId} in ${allianceId}`);
  }
}