// File path: src/commands/alliance/promote.ts

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../Command";
import { AllianceSystem } from "../../system/alliance/AllianceSystem";
import { SafeMode } from "../../system/SafeMode";

/**
 * PromoteCommand
 * ----------------
 * Allows a leader or moderator to promote a member in the alliance.
 * - Checks SafeMode and guild context.
 * - Ensures the target member is in the same alliance and eligible for promotion.
 */
export const Command: Command = {
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
    const userId = interaction.user.id;
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
      const result = await AllianceSystem.promoteMember(userId, targetUser.id, interaction.guild.id);
      
      await interaction.reply({
        content: `✅ <@${targetUser.id}> has been promoted to ${result.newRank} in the alliance.`,
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

export default Command;