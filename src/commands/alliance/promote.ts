// File path: src/commands/alliance/promote.ts
/**
 * ============================================
 * COMMAND: Promote
 * FILE: src/commands/alliance/promote.ts
 * LAYER: COMMAND (Alliance)
 * ============================================
 *
 * RESPONSIBILITY:
 * - Promote a member to a higher rank
 * - Only leader / R5 can promote
 * - Can be used only in #staff-room
 *
 * ============================================
 */

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../Command";
import { AllianceManager } from "../../system/alliance/AllianceManager";

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
    if (!interaction.guild) return;

    if (interaction.channel?.name !== "staff-room") {
      await interaction.reply({ content: "❌ This command can only be used in #staff-room.", ephemeral: true });
      return;
    }

    const actorId = interaction.user.id;
    const targetUser = interaction.options.getUser("member", true);

    try {
      const result = await AllianceManager.promoteMember(actorId, targetUser.id, interaction.guild.id);

      await interaction.reply({
        content: `✅ <@${targetUser.id}> has been promoted to **${result.newRank}**.`,
        ephemeral: false
      });
    } catch (error: any) {
      await interaction.reply({ content: `❌ Failed to promote member: ${error.message}`, ephemeral: true });
    }
  }
};

export default PromoteCommand;