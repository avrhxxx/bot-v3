// File path: src/commands/alliance/deny.ts
/**
 * ============================================
 * COMMAND: Deny / Reject
 * FILE: src/commands/alliance/deny.ts
 * LAYER: COMMAND (Alliance)
 * ============================================
 *
 * ODPOWIEDZIALNOŚĆ:
 * - Odrzucenie zgłoszenia użytkownika do sojuszu
 * - Tylko dla R5 / R4 / leader
 * - Integracja z MembershipModule
 *
 * TODO:
 * - Walidacja uprawnień (R5/R4/leader)
 * - Pobranie zgłoszenia z kolejki join
 * - Odrzucenie zgłoszenia i powiadomienie użytkownika
 *
 * ============================================
 */

import { Command } from "../Command";

export const DenyCommand: Command = {
  name: "deny",
  description: "Odrzuca zgłoszenie użytkownika do sojuszu",
  execute: async (interaction) => {
    // TODO: implementacja odrzucenia członka
  },
};