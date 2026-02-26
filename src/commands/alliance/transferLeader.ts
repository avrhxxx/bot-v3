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
 * - Only R5 can execute
 * - Can be used only in #staff-room
 * - Integrates with AllianceManager
 *
 * ============================================
 */

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../Command";
import { AllianceManager } from "../../system/alliance/AllianceManager";

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

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    // ✅ Only in #staff-room
    if (interaction.channel?.name !== "staff-room") {
      await interaction.reply({
        content: "❌ This command can only be used in #staff-room.",
        ephemeral: true
      });
      return;
    }

    const actorId = interaction.user.id;
    const newLeaderId = interaction.options.getUser("new_leader", true).id;

    const alliance = await AllianceManager.getAllianceByMember(actorId);
    if (!alliance || alliance.members.r5 !== actorId) {
      await interaction.reply({
        content: "❌ Only R5 can transfer leadership.",
        ephemeral: true
      });
      return;
    }

    try {
      await AllianceManager.transferLeader(actorId, alliance.id, newLeaderId);

      await interaction.reply({
        content: `✅ Leadership has been successfully transferred to <@${newLeaderId}>.`,
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