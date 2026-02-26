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
 * - Integrates with AllianceOrchestrator
 * - Sends confirmation message
 *
 * NOTES:
 * - Checks if the command is used inside a guild
 * - SafeMode references removed (module no longer exists)
 *
 * ============================================
 */

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../Command";
import { AllianceOrchestrator } from "../../system/alliance/orchestrator/AllianceOrchestrator";

// SafeMode import removed because the module no longer exists
// import { SafeMode } from "../../system/SafeMode";

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

    // SafeMode check removed because the module no longer exists
    // if (SafeMode.isActive()) {
    //   await interaction.reply({ content: "⛔ System in SAFE_MODE – cannot leave alliance.", ephemeral: true });
    //   return;
    // }

    try {
      // 1️⃣ Attempt to leave the alliance atomically via orchestrator
      const result = await AllianceOrchestrator.leaveAlliance(userId, interaction.guild.id);

      // 2️⃣ Confirmation message
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