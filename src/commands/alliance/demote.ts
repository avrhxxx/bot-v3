// File path: src/commands/alliance/demote.ts
/**
 * ============================================
 * COMMAND: Demote
 * FILE: src/commands/alliance/demote.ts
 * LAYER: COMMAND (Alliance)
 * ============================================
 *
 * RESPONSIBILITY:
 * - Demote an alliance member to a lower rank (R5 → R4 → R3)
 * - Only leader / R5 can demote
 * - Integrates with AllianceOrchestrator
 *
 * NOTES:
 * - Validates permissions
 * - Checks role limits
 * - Handles errors and SafeMode
 *
 * ============================================
 */

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../Command";
import { AllianceOrchestrator } from "../../system/alliance/orchestrator/AllianceOrchestrator";
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
    const actorId = interaction.user.id;
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
      // 1️⃣ Execute demotion atomically via AllianceOrchestrator
      await AllianceOrchestrator.demote(actorId, interaction.guild.id, targetUser.id);

      // 2️⃣ Notify success
      await interaction.reply({
        content: `✅ <@${targetUser.id}> has been demoted in the alliance.`,
        ephemeral: false
      });
    } catch (error: any) {
      // 3️⃣ Handle errors
      await interaction.reply({
        content: `❌ Failed to demote member: ${error.message}`,
        ephemeral: true
      });
    }
  }
};

export default DemoteCommand;