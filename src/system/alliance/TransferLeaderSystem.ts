// File path: src/system/alliance/TransferLeaderSystem.ts
/**
 * ============================================
 * FILE: src/system/alliance/TransferLeaderSystem.ts
 * LAYER: SYSTEM (Leadership Domain Logic)
 * ============================================
 *
 * ODPOWIEDZIALNOŚĆ:
 * - Manualny transfer lidera (R5 → R5) za pomocą komendy
 *
 * ZALEŻNOŚCI:
 * - AllianceService (pobranie sojuszu + audit)
 * - RoleModule (aktualizacja ról Discord)
 * - BroadcastModule (ogłoszenia)
 *
 * UWAGA:
 * - MutationGate używane do atomowych operacji
 *
 * ============================================
 */

import { AllianceService } from "./AllianceService";
import { RoleModule } from "./modules/role/RoleModule";
import { BroadcastModule } from "./modules/broadcast/BroadcastModule";
import { MutationGate } from "../../engine/MutationGate";
import { Alliance } from "./AllianceTypes";

export class TransferLeaderSystem {

  // ----------------- MANUAL TRANSFER -----------------
  static async transferLeadership(actorId: string, allianceId: string, newLeaderId: string) {
    await MutationGate.runAtomically(async () => {
      const alliance = await AllianceService.getAllianceOrThrow(allianceId);

      if (!alliance.members[newLeaderId]) {
        throw new Error("Nowy lider nie jest członkiem sojuszu");
      }

      // Zaktualizuj role Discord
      await RoleModule.assignLeaderRoles(
        alliance.members[newLeaderId].guildMember,
        alliance.roles
      );

      // Aktualizacja lidera w bazie
      alliance.leaderId = newLeaderId;
      await AllianceService.updateAlliance(alliance);

      // Powiadomienie broadcast
      await BroadcastModule.broadcast(
        allianceId,
        `Nowym liderem sojuszu ${alliance.tag} jest <@${newLeaderId}>!`
      );
    });
  }

  // ----------------- VALIDATION -----------------
  static validateLeadership(alliance: Alliance) {
    if (!alliance.members[alliance.leaderId]) {
      throw new Error("Nieprawidłowy lider: brak w członkach sojuszu");
    }
  }
}