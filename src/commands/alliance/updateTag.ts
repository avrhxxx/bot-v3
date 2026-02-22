// File path: src/commands/alliance/updateTag.ts

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../Command";
import { AllianceSystem } from "../../system/alliance/AllianceSystem";
import { SafeMode } from "../../system/SafeMode";

/**
 * UpdateTagCommand
 * ----------------
 * Allows the alliance leader to change the alliance's tag.
 * - Tag must be exactly 3 characters: letters (A-Z) or numbers (0-9).
 */
export const Command: Command = {
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
    const userId = interaction.user.id;
    const newTag = interaction.options.getString("tag", true).toUpperCase();

    if (!interaction.guild) {
      await interaction.reply({ content: "❌ Cannot update tag outside a guild.", ephemeral: true });
      return;
    }

    if (SafeMode.isActive()) {
      await interaction.reply({ content: "⛔ System in SAFE_MODE – cannot update tag.", ephemeral: true });
      return;
    }

    if (!/^[A-Z0-9]{3}$/.test(newTag)) {
      await interaction.reply({ content: "❌ Tag must be exactly 3 characters: letters (A-Z) or numbers (0-9).", ephemeral: true });
      return;
    }

    try {
      await AllianceSystem.updateTag(userId, interaction.guild.id, newTag);
      await interaction.reply({
        content: `✅ Alliance tag has been updated to \`${newTag}\`.`,
        ephemeral: false
      });
    } catch (error: any) {
      await interaction.reply({
        content: `❌ Failed to update tag: ${error.message}`,
        ephemeral: true
      });
    }
  }
};

export default Command;