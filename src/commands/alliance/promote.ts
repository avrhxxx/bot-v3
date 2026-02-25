// File path: src/commands/alliance/promote.ts
/**
 * ============================================
 * COMMAND: Promote
 * FILE: src/commands/alliance/promote.ts
 * LAYER: COMMAND (Alliance)
 * ============================================
 *
 * RESPONSIBILITY:
 * - Promote a member to a higher rank in the alliance
 * - Only leader / R5 can promote
 * - Integrates with AllianceOrchestrator
 *
 * NOTES:
 * - Checks if command is used inside a guild
 * - Respects SafeMode
 * - Handles errors gracefully
 *
 * ============================================
 */

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../Command";
import { AllianceOrchestrator } from "../../system/alliance/orchestrator/AllianceOrchestrator";
import { SafeMode } from "../../system/SafeMode";

export const PromoteCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("promote")
    .setDescription("Promote a member to the next rank in your alliance")
    .addUserOption(option =>
      option
        .setName("member")
        .setDescription("Member to promote")
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const actorId = interaction.user.id;
    const targetUser = interaction.options.getUser("member", true);

    if (!interaction.guild) {
      await interaction.reply({ content: "❌ Cannot promote outside a guild.", ephemeral: true });
      return;
    }

    if (SafeMode.isActive()) {
      await interaction.reply({ content: "⛔ System in SAFE_MODE – cannot promote members.", ephemeral: true });
      return;
    }

    try {
      // 1️⃣ Promote member atomically via AllianceOrchestrator
      const result = await AllianceOrchestrator.promoteMember(actorId, targetUser.id, interaction.guild.id);

      // 2️⃣ Confirmation message
      await interaction.reply({
        content: `✅ <@${targetUser.id}> has been promoted to **${result.newRank}** in the alliance.`,
        ephemeral: false
      });
    } catch (error: any) {
      await interaction.reply({
        content: `❌ Failed to promote member: ${error.message}`,
        ephemeral: true
      });
    }
  }
};

export default PromoteCommand;