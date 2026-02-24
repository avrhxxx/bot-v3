// File path: src/commands/alliance/broadcast.ts
/**
 * ============================================
 * COMMAND: Broadcast
 * FILE: src/commands/alliance/broadcast.ts
 * LAYER: COMMAND (Alliance)
 * ============================================
 *
 * ODPOWIEDZIALNOŚĆ:
 * - Wysyłanie wiadomości do wszystkich członków sojuszu
 * - Integracja z BroadcastModule
 *
 * TODO:
 * - Pobranie listy członków z AllianceService
 * - Wysłanie wiadomości przy użyciu BroadcastModule
 *
 * ============================================
 */

import { Command } from "../Command";

export const BroadcastCommand: Command = {
  name: "broadcast",
  description: "Wysyła wiadomość do wszystkich członków sojuszu",
  execute: async (interaction) => {
    // TODO: implementacja wysyłki wiadomości
  },
};