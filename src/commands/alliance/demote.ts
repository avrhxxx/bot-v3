// File path: src/commands/alliance/demote.ts
/**
 * ============================================
 * COMMAND: Demote
 * FILE: src/commands/alliance/demote.ts
 * LAYER: COMMAND (Alliance)
 * ============================================
 *
 * ODPOWIEDZIALNOŚĆ:
 * - Demote członka sojuszu do niższego rangu (R5 → R4 → R3)
 * - Tylko dla leadera / R5
 * - Integracja z AllianceSystem
 *
 * TODO:
 * - Walidacja uprawnień
 * - Sprawdzenie limitów ról
 * - Obsługa błędów i SafeMode
 *
 * ============================================
 */

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../Command";
import { AllianceSystem } from "../../system/alliance/AllianceSystem";
import { SafeMode } from "../../system/SafeMode";

export const DemoteCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("demote")
    .setDescription("Demote a member to a lower rank in your alliance")
    .addUserOption(option =>
      option
        .setName("member")
        .setDescription("Member to demote")
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const userId = interaction.user.id;
    const targetUser = interaction.options.getUser("member", true);

    if (!interaction.guild) {
      await interaction.reply({ content: "❌ Cannot demote outside a guild.", ephemeral: true });
      return;
    }

    if (SafeMode.isActive()) {
      await interaction.reply({ content: "⛔ System in SAFE_MODE – cannot demote members.", ephemeral: true });
      return;
    }

    try {
      // Wywołanie demote w AllianceSystem
      const result = await AllianceSystem.demoteMember(userId, targetUser.id, interaction.guild.id);

      // Informacja o sukcesie
      await interaction.reply({
        content: `✅ <@${targetUser.id}> has been demoted to **${result.newRank}** in the alliance.`,
        ephemeral: false
      });
    } catch (error: any) {
      await interaction.reply({
        content: `❌ Failed to demote member: ${error.message}`,
        ephemeral: true
      });
    }
  }
};

export default DemoteCommand;