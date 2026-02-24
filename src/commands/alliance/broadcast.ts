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
import { AllianceSystem } from "../../system/alliance/AllianceSystem";
import { BroadcastModule } from "../../system/alliance/modules/broadcast/BroadcastModule";
import { ChannelModule } from "../../system/alliance/modules/channel/ChannelModule";

export const BroadcastCommand: Command = {
  name: "broadcast",
  description: "Wysyła wiadomość do wszystkich członków sojuszu",
  execute: async (interaction) => {
    const memberId = interaction.user.id;
    const guild = interaction.guild;

    if (!guild) return;

    // Pobranie sojuszu użytkownika
    const alliance = AllianceSystem.getAllianceByMember(memberId);
    if (!alliance) {
      return interaction.reply({ content: "Nie jesteś członkiem żadnego sojuszu.", ephemeral: true });
    }

    // Sprawdzenie uprawnień (R4/R5)
    if (!alliance.members.r5.includes(memberId) && !alliance.members.r4.includes(memberId)) {
      return interaction.reply({ content: "Nie masz uprawnień do użycia tej komendy.", ephemeral: true });
    }

    // Pobranie treści wiadomości z interakcji
    const messageContent = interaction.options.getString("message");
    if (!messageContent) {
      return interaction.reply({ content: "Musisz podać wiadomość do wysłania.", ephemeral: true });
    }

    // Pobranie kanału announce
    const announceChannelId = ChannelModule.getChannelId(alliance.id, "announce");
    const announceChannel = guild.channels.cache.get(announceChannelId);
    if (!announceChannel?.isTextBased()) {
      return interaction.reply({ content: "Nie udało się znaleźć kanału announce.", ephemeral: true });
    }

    // Wysłanie wiadomości przez BroadcastModule
    await BroadcastModule.broadcast(announceChannel, messageContent, alliance);

    // Nie wysyłamy ephemerala, bo sam kanał zobaczy wiadomość
  },
};