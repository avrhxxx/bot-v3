// File path: src/commands/alliance/transferLeader.ts
/**
 * ============================================
 * COMMAND: Transfer Leader
 * FILE: src/commands/alliance/transferLeader.ts
 * LAYER: COMMAND (Alliance)
 * ============================================
 *
 * RESPONSIBILITY:
 * - Allows the current leader to transfer leadership to another member
 * - Validates that the actor is the current leader
 * - Checks that the new leader is a member of the alliance
 * - Integrates with AllianceOrchestrator
 *
 * NOTES:
 * - Only the current leader can execute this command
 * - Uses MutationGate for safe execution inside the orchestrator
 * - Replies with confirmation or error messages
 *
 * ============================================
 */

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../Command";
import { AllianceOrchestrator } from "../../system/alliance/orchestrator/AllianceOrchestrator";

export const TransferLeaderCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("transfer_leader")
    .setDescription("Transfer leadership of your alliance to another member")
    .addUserOption(option =>
      option
        .setName("new_leader")
        .setDescription("Member who will become the new leader")
        .setRequired(true)
    ),
  ownerOnly: false,
  systemLayer: false,

  async execute(interaction: ChatInputCommandInteraction) {
    const actorId = interaction.user.id;
    const newLeader = interaction.options.getUser("new_leader", true);

    if (!interaction.guild) {
      await interaction.reply({ content: "❌ Cannot transfer leadership outside a guild.", ephemeral: true });
      return;
    }

    try {
      // 1️⃣ Transfer leadership atomically via AllianceOrchestrator
      // Poprawiona kolejność argumentów: actorId, allianceId, newLeaderId
      await AllianceOrchestrator.transferLeader(actorId, interaction.guild.id, newLeader.id);

      // 2️⃣ Confirmation message
      await interaction.reply({
        content: `✅ Leadership has been successfully transferred to <@${newLeader.id}>.`,
        ephemeral: false
      });
    } catch (error: any) {
      await interaction.reply({
        content: `❌ Failed to transfer leadership: ${error.message}`,
        ephemeral: true
      });
    }
  }
};

export default TransferLeaderCommand;