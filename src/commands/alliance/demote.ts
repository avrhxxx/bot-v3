// File path: src/commands/alliance/demote.ts
/**
 * ============================================
 * COMMAND: Demote
 * FILE: src/commands/alliance/demote.ts
 * LAYER: COMMAND (Alliance)
 * ============================================
 *
 * RESPONSIBILITY:
 * - Demote a member to a lower rank (R5 → R4 → R3)
 * - Only leader / R5 can demote
 * - Can be used only in #staff-room
 *
 * ============================================
 */

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../Command";
import { AllianceOrchestrator } from "../../system/alliance/orchestrator/AllianceOrchestrator";

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
    if (!interaction.guild) return;

    if (interaction.channel?.name !== "staff-room") {
      await interaction.reply({
        content: "❌ This command can only be used in #staff-room.",
        ephemeral: true
      });
      return;
    }

    const actorId = interaction.user.id;
    const targetUser = interaction.options.getUser("member", true);

    try {
      await AllianceOrchestrator.demote(actorId, interaction.guild.id, targetUser.id);

      await interaction.reply({
        content: `✅ <@${targetUser.id}> has been demoted in the alliance.`,
        ephemeral: false
      });
    } catch (error: any) {
      await interaction.reply({ content: `❌ Failed to demote member: ${error.message}`, ephemeral: true });
    }
  }
};

export default DemoteCommand;