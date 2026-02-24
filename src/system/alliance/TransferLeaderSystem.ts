/**
 * ============================================
 * FILE: src/system/alliance/TransferLeaderSystem.ts
 * LAYER: SYSTEM (Leadership Domain Logic)
 * ============================================
 *
 * ODPOWIEDZIALNOŚĆ:
 * - Manualny transfer lidera (R5 → R5) za pomocą komendy
 * - Powiadomienie o nowym liderze poprzez BroadcastModule
 *
 * ZALEŻNOŚCI:
 * - AllianceService (pobranie sojuszu + audyt + update)
 * - RoleModule (aktualizacja ról Discord)
 * - BroadcastModule (ogłoszenia)
 * - MutationGate (atomowe operacje)
 *
 * UWAGA:
 * - Walidacja i atomiczne mutacje zapewniają spójność
 * - Rollback leadership nie jest potrzebny, integrity sprawdza spójność po zmianie
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
      const alliance: Alliance = await AllianceService.getAllianceOrThrow(allianceId);

      // ----------------- WALIDACJA CZŁONKA -----------------
      const allMembers = [
        ...(alliance.members.r3 || []),
        ...(alliance.members.r4 || []),
        alliance.members.r5 ? [alliance.members.r5] : []
      ];

      if (!allMembers.includes(newLeaderId)) {
        throw new Error("Nowy lider nie jest członkiem sojuszu");
      }

      // ----------------- AKTUALIZACJA RÓL DISCORD -----------------
      const guildMember = await AllianceService.fetchGuildMember(alliance.guildId, newLeaderId);
      if (!guildMember) throw new Error("Nie można pobrać GuildMember dla nowego lidera");

      await RoleModule.assignLeaderRoles(guildMember, alliance.roles);

      // ----------------- AKTUALIZACJA LIDERA W SOJUSZU -----------------
      alliance.members.r5 = newLeaderId;  // R5 zawsze pojedynczy
      // Jeśli nowy lider był wcześniej R4 lub R3, usuwamy go z tamtych list
      alliance.members.r4 = (alliance.members.r4 || []).filter(id => id !== newLeaderId);
      alliance.members.r3 = (alliance.members.r3 || []).filter(id => id !== newLeaderId);

      await AllianceService.updateAlliance(alliance);

      // ----------------- POWIADOMIENIE BROADCAST -----------------
      await BroadcastModule.announceLeadershipChange(allianceId, actorId, newLeaderId);
      await AllianceService.logAudit(allianceId, {
        action: "transferLeadership",
        actorId,
        newLeaderId
      });
    });
  }

  // ----------------- WALIDACJA LIDERA -----------------
  static validateLeadership(alliance: Alliance) {
    const leaderId = alliance.members.r5;
    const allMembers = [
      ...(alliance.members.r3 || []),
      ...(alliance.members.r4 || []),
      leaderId ? [leaderId] : []
    ];

    if (!leaderId || !allMembers.includes(leaderId)) {
      throw new Error("Nieprawidłowy lider: brak w członkach sojuszu");
    }
  }
}

/**
 * ============================================
 * FILEPATH: src/system/alliance/TransferLeaderSystem.ts
 * ============================================
 */