export class RulesModule {
  static validateJoin(allianceId: string, memberId: string) {
    console.log(`[Rules] Validating join of ${memberId} to ${allianceId}`);
  }

  static validateLeaderChange(allianceId: string, newLeaderId: string) {
    console.log(`[Rules] Validating leader change to ${newLeaderId} in ${allianceId}`);
  }
}