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
 * - Integrates with AllianceSystem and MutationGate
 *
 * NOTES:
 * - Only the current leader can execute this command
 * - Uses MutationGate for safe execution
 * - Replies with confirmation or error messages
 *
 * ============================================
 */

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../Command";
import { AllianceSystem } from "../../system/alliance/AllianceSystem";
import { MutationGate } from "../../engine/MutationGate";

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

    // 1️⃣ Get the alliance of the actor
    const alliance = await AllianceSystem.getAllianceByMember(actorId);
    if (!alliance) {
      await interaction.reply({ content: "❌ You are not in an alliance.", ephemeral: true });
      return;
    }

    // 2️⃣ Check if actor is the current leader
    if (!AllianceSystem.isLeader(alliance, actorId)) {
      await interaction.reply({ content: "⛔ Only the leader can transfer leadership.", ephemeral: true });
      return;
    }

    // 3️⃣ Check if new leader is a member of the alliance
    if (!AllianceSystem.isMember(alliance, newLeader.id)) {
      await interaction.reply({ content: "❌ The selected user is not a member of your alliance.", ephemeral: true });
      return;
    }

    try {
      // 4️⃣ Execute transfer safely via MutationGate
      await MutationGate.execute(
        { operation: "TRANSFER_LEADER", actor: actorId, requireGlobalLock: false },
        async () => {
          await AllianceSystem.transferLeader(alliance, newLeader.id);
        }
      );

      // 5️⃣ Confirmation message
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