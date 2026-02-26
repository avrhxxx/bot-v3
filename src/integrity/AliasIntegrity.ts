import { AllianceService } from "../AllianceService";

export class AliasIntegrity {
  static checkAlliance(allianceId: string) {
    const alliance = AllianceService.getAlliance(allianceId);
    console.log(`[Integrity] Checking alliance ${allianceId}`, alliance);
  }
}