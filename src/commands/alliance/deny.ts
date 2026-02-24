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
 * IMPLEMENTACJA:
 * - Walidacja uprawnień (R5/R4/leader)
 * - Pobranie zgłoszenia z kolejki join
 * - Odrzucenie zgłoszenia i powiadomienie użytkownika
 *
 * ============================================
 */

import { Command } from "../Command";
import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { MembershipModule } from "../../system/alliance/modules/membership/MembershipModule";

export const Command: Command = {
  data: new SlashCommandBuilder()
    .setName("deny")
    .setDescription("Odrzuca zgłoszenie użytkownika do sojuszu")
    .addUserOption(option =>
      option
        .setName("member")
        .setDescription("Użytkownik do odrzucenia")
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const actorId = interaction.user.id;
    const targetUser = interaction.options.getUser("member", true);

    if (!interaction.guild) {
      await interaction.reply({ content: "❌ Cannot deny outside a guild.", ephemeral: true });
      return;
    }

    try {
      // Wywołanie funkcji w MembershipModule, która usuwa zgłoszenie z kolejki
      await MembershipModule.denyMember(actorId, targetUser.id, interaction.guild.id);

      // Powiadomienie użytkownika, że został odrzucony
      await targetUser.send(
        `❌ Twoje zgłoszenie do sojuszu zostało odrzucone. Możesz spróbować ponownie.`
      ).catch(() => {
        // ignorujemy, jeśli nie można wysłać DM
      });

      // Odpowiedź w kanale komendy
      await interaction.reply({
        content: `✅ Zgłoszenie użytkownika <@${targetUser.id}> zostało odrzucone.`,
        ephemeral: false
      });
    } catch (error: any) {
      await interaction.reply({
        content: `❌ Nie udało się odrzucić zgłoszenia: ${error.message}`,
        ephemeral: true
      });
    }
  }
};

export default Command;