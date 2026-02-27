import { AllianceOrkiestror } from "../../orkiestror/AllianceOrkiestror";

export class RulesModule {
  static validateJoin(allianceId: string, memberId: string) {
    const alliance = AllianceOrkiestror.getAlliance(allianceId);
    if (!alliance) {
      throw new Error(`[RulesModule] Alliance ${allianceId} does not exist`);
    }

    if (alliance.members.includes(memberId)) {
      throw new Error(`[RulesModule] Member ${memberId} already in alliance ${allianceId}`);
    }
  }

  static validateLeaderChange(allianceId: string, newLeaderId: string) {
    const alliance = AllianceOrkiestror.getAlliance(allianceId);
    if (!alliance) {
      throw new Error(`[RulesModule] Alliance ${allianceId} does not exist`);
    }

    if (!alliance.members.includes(newLeaderId)) {
      throw new Error(`[RulesModule] Member ${newLeaderId} is not part of alliance ${allianceId}`);
    }
  }
}