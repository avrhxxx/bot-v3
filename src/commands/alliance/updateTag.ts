// File path: src/commands/alliance/updateTag.ts
/**
 * ============================================
 * COMMAND: Update Tag
 * FILE: src/commands/alliance/updateTag.ts
 * LAYER: COMMAND (Alliance)
 * ============================================
 *
 * RESPONSIBILITY:
 * - Allows the alliance leader to change the alliance tag
 * - Validates tag format (3 characters: letters and numbers only)
 * - Integrates with AllianceOrchestrator
 *
 * NOTES:
 * - Only the leader can execute this command
 * - Sends confirmation or error message
 *
 * ============================================
 */

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../Command";
import { AllianceOrchestrator } from "../../system/alliance/orchestrator/AllianceOrchestrator";
import { SafeMode } from "../../system/SafeMode";

export const UpdateTagCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("update_tag")
    .setDescription("Change your alliance tag (letters and numbers only)")
    .addStringOption(option =>
      option
        .setName("tag")
        .setDescription("New 3-character alliance tag")
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const actorId = interaction.user.id;
    const newTag = interaction.options.getString("tag", true).toUpperCase();

    if (!interaction.guild) {
      await interaction.reply({ content: "❌ Cannot update tag outside a guild.", ephemeral: true });
      return;
    }

    if (SafeMode.isActive()) {
      await interaction.reply({ content: "⛔ System in SAFE_MODE – cannot update alliance tag.", ephemeral: true });
      return;
    }

    if (!/^[A-Z0-9]{3}$/.test(newTag)) {
      await interaction.reply({
        content: "❌ Tag must be exactly 3 characters: letters (A-Z) or numbers (0-9).",
        ephemeral: true
      });
      return;
    }

    try {
      // 1️⃣ Update tag via AllianceOrchestrator
      await AllianceOrchestrator.updateTag(actorId, interaction.guild.id, newTag);

      // 2️⃣ Confirmation message
      await interaction.reply({
        content: `✅ Alliance tag has been successfully updated to \`${newTag}\`.`,
        ephemeral: false
      });
    } catch (error: any) {
      await interaction.reply({
        content: `❌ Failed to update alliance tag: ${error.message}`,
        ephemeral: true
      });
    }
  }
};

export default UpdateTagCommand;