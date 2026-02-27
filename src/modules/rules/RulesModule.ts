import { AllianceService } from "../../AllianceServices";

export class RulesModule {
  /**
   * Walidacja dołączenia członka do sojuszu.
   * Jeśli sojusz nie istnieje, automatycznie go tworzy.
   */
  static async validateJoin(allianceId: string, memberId: string): Promise<void> {
    let alliance = await AllianceService.getAlliance(allianceId);

    if (!alliance) {
      console.log(`[RulesModule] Alliance ${allianceId} does not exist. Auto-creating...`);
      await AllianceService.createAlliance(allianceId, 'AutoCreated Alliance');
      alliance = await AllianceService.getAlliance(allianceId);
    }

    if (alliance.members.includes(memberId)) {
      throw new Error(`[RulesModule] Member ${memberId} already in alliance ${allianceId}`);
    }

    console.log(`[RulesModule] validateJoin: ${memberId} in ${allianceId}`);
  }

  /**
   * Walidacja zmiany lidera w sojuszu.
   * Sprawdza, czy sojusz istnieje i czy nowy lider jest członkiem.
   */
  static async validateLeaderChange(allianceId: string, newLeaderId: string): Promise<void> {
    const alliance = await AllianceService.getAlliance(allianceId);
    if (!alliance) {
      throw new Error(`[RulesModule] Alliance ${allianceId} does not exist`);
    }

    if (!alliance.members.includes(newLeaderId)) {
      throw new Error(`[RulesModule] New leader ${newLeaderId} is not a member of alliance ${allianceId}`);
    }

    console.log(`[RulesModule] validateLeaderChange: ${newLeaderId} in ${allianceId}`);
  }
}