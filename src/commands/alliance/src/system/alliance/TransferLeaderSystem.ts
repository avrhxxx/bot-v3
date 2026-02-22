// src/system/alliance/TransferLeaderSystem.ts

import { AllianceService } from "../../features/alliance/AllianceService";
import { RoleModule } from "./AllianceSystem";
import { Journal } from "../../journal/Journal";

export class TransferLeaderSystem {
  // czas reakcji po wykryciu braku lidera w ms, np. 3000 = 3s
  static fallbackDelay = 3000;

  /**
   * Automatyczny transfer lidera w przypadku opuszczenia serwera.
   * Jeśli brak R4 → wybiera R3, jeśli brak R3 → wygasza sojusz.
   */
  static async handleLeaderLeft(allianceId: string) {
    // małe opóźnienie, aby eventy zdążyły się przetworzyć
    await new Promise(res => setTimeout(res, TransferLeaderSystem.fallbackDelay));

    const members = AllianceService.getMembers(allianceId);

    // najstarszy R4
    const candidateR4 = members.filter(m => m.role === RoleModule.R4)
                               .sort((a, b) => a.joinedAt - b.joinedAt)[0];

    if (candidateR4) {
      AllianceService.setLeader(allianceId, candidateR4.id);
      Journal.log({
        action: "AUTO_TRANSFER_LEADER",
        allianceId,
        performedBy: "SYSTEM",
        target: candidateR4.id,
        timestamp: new Date()
      });
      return;
    }

    // najstarszy R3
    const candidateR3 = members.filter(m => m.role === RoleModule.R3)
                               .sort((a, b) => a.joinedAt - b.joinedAt)[0];

    if (candidateR3) {
      AllianceService.setLeader(allianceId, candidateR3.id);
      Journal.log({
        action: "AUTO_TRANSFER_LEADER",
        allianceId,
        performedBy: "SYSTEM",
        target: candidateR3.id,
        timestamp: new Date()
      });
      return;
    }

    // brak kandydatów → wygaszamy sojusz
    AllianceService.deleteAlliance(allianceId);
    Journal.log({
      action: "ALLIANCE_EXPIRED",
      allianceId,
      performedBy: "SYSTEM",
      timestamp: new Date()
    });
  }
}