import { AllianceService } from "../../features/alliance/AllianceService";
import { RoleModule } from "./AllianceSystem";
import { Journal } from "../../journal/Journal";

export class TransferLeaderSystem {
  static fallbackDelay = 3000;

  static async handleLeaderLeft(allianceId: string) {
    await new Promise(res => setTimeout(res, TransferLeaderSystem.fallbackDelay));

    const members = AllianceService.getMembers(allianceId);

    const candidateR4 = members
      .filter(m => m.role === RoleModule.R4)
      .sort((a, b) => a.joinedAt - b.joinedAt)[0];

    if (candidateR4) {
      AllianceService.setLeader(allianceId, candidateR4.id);
      Journal.log({ action: "AUTO_TRANSFER_LEADER", allianceId, performedBy: "SYSTEM", target: candidateR4.id, timestamp: new Date() });
      return;
    }

    const candidateR3 = members
      .filter(m => m.role === RoleModule.R3)
      .sort((a, b) => a.joinedAt - b.joinedAt)[0];

    if (candidateR3) {
      AllianceService.setLeader(allianceId, candidateR3.id);
      Journal.log({ action: "AUTO_TRANSFER_LEADER", allianceId, performedBy: "SYSTEM", target: candidateR3.id, timestamp: new Date() });
      return;
    }

    AllianceService.deleteAlliance(allianceId);
    Journal.log({ action: "ALLIANCE_EXPIRED", allianceId, performedBy: "SYSTEM", timestamp: new Date() });
  }
}