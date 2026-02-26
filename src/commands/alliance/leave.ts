// File path: src/commands/alliance/leave.ts
/**
 * ============================================
 * COMMAND: Leave
 * FILE: src/commands/alliance/leave.ts
 * LAYER: COMMAND (Alliance)
 * ============================================
 *
 * RESPONSIBILITY:
 * - Allows a member to leave their current alliance
 * - Integrates with AllianceManager
 * - Sends confirmation message
 *
 * NOTES:
 * - Checks if the command is used inside a guild
 *
 * ============================================
 */

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../Command";
import { AllianceManager } from "../../system/alliance/AllianceManager";

export const LeaveCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("leave")
    .setDescription("Leave your current alliance"),

  async execute(interaction: ChatInputCommandInteraction) {
    const userId = interaction.user.id;

    if (!interaction.guild) {
      await interaction.reply({ content: "❌ You cannot leave an alliance outside a guild.", ephemeral: true });
      return;
    }

    try {
      // Attempt to leave the alliance via manager
      const result = await AllianceManager.leaveAlliance(userId, interaction.guild.id);

      // Confirmation message
      await interaction.reply({
        content: `✅ You have successfully left the alliance \`${result.tag}\`.`,
        ephemeral: false
      });
    } catch (error: any) {
      await interaction.reply({
        content: `❌ Failed to leave alliance: ${error.message}`,
        ephemeral: true
      });
    }
  }
};

export default LeaveCommand;