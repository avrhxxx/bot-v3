// File path: src/commands/alliance/kick.ts
/**
 * ============================================
 * COMMAND: Kick
 * FILE: src/commands/alliance/kick.ts
 * LAYER: COMMAND (Alliance)
 * ============================================
 *
 * RESPONSIBILITY:
 * - Kick a member from the alliance
 * - R5 can kick anyone
 * - R4 can kick only R3
 * - Can be used only in #staff-room
 *
 * ============================================
 */

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../Command";
import { AllianceOrchestrator } from "../../system/alliance/orchestrator/AllianceOrchestrator";

export const KickCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a member from your alliance")
    .addUserOption(option =>
      option
        .setName("member")
        .setDescription("Member to kick")
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
      const result = await AllianceOrchestrator.kickMember(actorId, targetUser.id, interaction.guild.id);

      if (result.success) {
        await interaction.reply({ content: `✅ <@${targetUser.id}> has been kicked from the alliance.`, ephemeral: false });
      } else {
        await interaction.reply({ content: `❌ You do not have permission to kick <@${targetUser.id}>.`, ephemeral: true });
      }
    } catch (error: any) {
      await interaction.reply({ content: `❌ Failed to kick member: ${error.message}`, ephemeral: true });
    }
  }
};

export default KickCommand;