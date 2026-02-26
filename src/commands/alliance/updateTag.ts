// File path: src/commands/alliance/updateTag.ts
/**
 * ============================================
 * COMMAND: Update Tag
 * FILE: src/commands/alliance/updateTag.ts
 * LAYER: COMMAND (Alliance)
 * ============================================
 *
 * RESPONSIBILITY:
 * - Allows the alliance leader (R5) to change the alliance tag
 * - Validates tag format (3 characters: letters and numbers only)
 * - Can be used only in #staff-room
 *
 * ============================================
 */

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../Command";
import { AllianceOrchestrator } from "../../system/alliance/orchestrator/AllianceOrchestrator";
import { AllianceService } from "../../system/alliance/AllianceService";

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
    if (!interaction.guild) return;

    if (interaction.channel?.name !== "staff-room") {
      await interaction.reply({
        content: "❌ This command can only be used in #staff-room.",
        ephemeral: true
      });
      return;
    }

    const actorId = interaction.user.id;
    const newTag = interaction.options.getString("tag", true).toUpperCase();

    const alliance = await AllianceService.getAllianceByMember(actorId);
    if (!alliance || alliance.members.r5 !== actorId) {
      await interaction.reply({
        content: "❌ Only R5 can update the alliance tag.",
        ephemeral: true
      });
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
      await AllianceOrchestrator.updateTag(actorId, interaction.guild.id, newTag);

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