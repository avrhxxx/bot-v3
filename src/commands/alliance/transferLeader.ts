// File path: src/commands/alliance/transferLeader.ts
// fillpatch: Alliance transfer leader command – allows current leader to transfer leadership

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../Command";
import { AllianceSystem } from "../../system/alliance/AllianceSystem";
import { MutationGate } from "../../engine/MutationGate";

export const Command: Command = {
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
    const userId = interaction.user.id;
    const newLeader = interaction.options.getUser("new_leader", true);

    const alliance = await AllianceSystem.getAllianceByMember(userId);
    if (!alliance) {
      await interaction.reply({ content: "❌ You are not in an alliance.", ephemeral: true });
      return;
    }

    if (!AllianceSystem.isLeader(alliance, userId)) {
      await interaction.reply({ content: "⛔ Only the leader can transfer leadership.", ephemeral: true });
      return;
    }

    if (!AllianceSystem.isMember(alliance, newLeader.id)) {
      await interaction.reply({ content: "❌ The selected user is not a member of your alliance.", ephemeral: true });
      return;
    }

    try {
      await MutationGate.execute(
        { operation: "TRANSFER_LEADER", actor: userId, requireGlobalLock: false },
        async () => {
          await AllianceSystem.transferLeader(alliance, newLeader.id);
        }
      );

      await interaction.reply({
        content: `✅ Leadership has been transferred to <@${newLeader.id}>.`,
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

export default Command;