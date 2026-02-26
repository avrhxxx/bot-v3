// File path: src/commands/alliance/updateName.ts
/**
 * ============================================
 * COMMAND: Update Name
 * FILE: src/commands/alliance/updateName.ts
 * LAYER: COMMAND (Alliance)
 * ============================================
 *
 * RESPONSIBILITY:
 * - Allows the alliance leader (R5) to change the alliance name
 * - Validates new name format (letters and spaces only)
 * - Can be used only in #staff-room
 *
 * ============================================
 */

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../Command";
import { AllianceSystem } from "../../system/alliance/AllianceSystem";
import { AllianceService } from "../../system/alliance/AllianceService";

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
    if (!interaction.guild) return;

    if (interaction.channel?.name !== "staff-room") {
      await interaction.reply({
        content: "❌ This command can only be used in #staff-room.",
        ephemeral: true
      });
      return;
    }

    const actorId = interaction.user.id;
    const newName = interaction.options.getString("name", true);

    const alliance = await AllianceService.getAllianceByMember(actorId);
    if (!alliance || alliance.members.r5 !== actorId) {
      await interaction.reply({
        content: "❌ Only R5 can update the alliance name.",
        ephemeral: true
      });
      return;
    }

    if (!/^[A-Za-z\s]{1,32}$/.test(newName)) {
      await interaction.reply({
        content: "❌ Name can only contain letters (A-Z) and spaces, max 32 characters.",
        ephemeral: true
      });
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