// File path: src/commands/alliance/updateName.ts
/**
 * ============================================
 * COMMAND: Update Name
 * FILE: src/commands/alliance/updateName.ts
 * LAYER: COMMAND (Alliance)
 * ============================================
 *
 * RESPONSIBILITY:
 * - Allows the alliance leader to change the alliance name
 * - Validates new name format (letters and spaces only)
 * - Integrates with AllianceSystem
 *
 * NOTES:
 * - Only the leader can execute this command
 * - Name max length: 32 characters
 * - Sends confirmation or error message
 *
 * ============================================
 */

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../Command";
import { AllianceSystem } from "../../system/alliance/AllianceSystem";
import { SafeMode } from "../../system/SafeMode";

export const UpdateNameCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("update_name")
    .setDescription("Change your alliance name (letters only)")
    .addStringOption(option =>
      option
        .setName("name")
        .setDescription("New alliance name")
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const actorId = interaction.user.id;
    const newName = interaction.options.getString("name", true);

    if (!interaction.guild) {
      await interaction.reply({ content: "❌ Cannot update name outside a guild.", ephemeral: true });
      return;
    }

    if (SafeMode.isActive()) {
      await interaction.reply({ content: "⛔ System in SAFE_MODE – cannot update alliance name.", ephemeral: true });
      return;
    }

    if (!/^[A-Za-z\s]{1,32}$/.test(newName)) {
      await interaction.reply({ content: "❌ Name can only contain letters (A-Z) and spaces, max 32 characters.", ephemeral: true });
      return;
    }

    try {
      await AllianceSystem.updateName(actorId, interaction.guild.id, newName);
      await interaction.reply({
        content: `✅ Alliance name has been successfully updated to \`${newName}\`.`,
        ephemeral: false
      });
    } catch (error: any) {
      await interaction.reply({
        content: `❌ Failed to update alliance name: ${error.message}`,
        ephemeral: true
      });
    }
  }
};

export default UpdateNameCommand;