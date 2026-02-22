// File path: src/commands/alliance/leave.ts

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../Command";
import { AllianceSystem } from "../../system/alliance/AllianceSystem";
import { SafeMode } from "../../system/SafeMode";

/**
 * LeaveCommand
 * ----------------
 * Allows a user to leave their current alliance.
 * - Prevents leaving if user is leader (requires transfer first).
 * - Checks SafeMode and guild context.
 */
export const Command: Command = {
  data: new SlashCommandBuilder()
    .setName("leave")
    .setDescription("Leave your current alliance"),
  
  async execute(interaction: ChatInputCommandInteraction) {
    const userId = interaction.user.id;

    if (!interaction.guild) {
      await interaction.reply({ content: "❌ Cannot leave alliance outside a guild.", ephemeral: true });
      return;
    }

    if (SafeMode.isActive()) {
      await interaction.reply({ content: "⛔ System in SAFE_MODE – cannot leave alliance.", ephemeral: true });
      return;
    }

    try {
      const result = await AllianceSystem.leaveAlliance(userId, interaction.guild.id);
      await interaction.reply({
        content: `✅ You have left the alliance \`${result.tag}\`.`,
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

export default Command;