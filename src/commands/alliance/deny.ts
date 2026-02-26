// File path: src/commands/alliance/deny.ts
/**
 * ============================================
 * COMMAND: Deny / Reject
 * FILE: src/commands/alliance/deny.ts
 * LAYER: COMMAND (Alliance)
 * ============================================
 *
 * RESPONSIBILITY:
 * - Reject a user's join request
 * - Only R5 / R4 / leader can deny
 * - Can be used only in #staff-room
 * - Sends DM to the denied user
 *
 * ============================================
 */

import { Command } from "../Command";
import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { AllianceOrchestrator } from "../../system/alliance/orchestrator/AllianceOrchestrator";
import { AllianceService } from "../../system/alliance/AllianceService";

export const DenyCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("deny")
    .setDescription("Reject a user's request to join the alliance")
    .addUserOption(option =>
      option
        .setName("member")
        .setDescription("The user to reject")
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    // ✅ Check channel
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
      // Deny join request
      await AllianceOrchestrator.denyJoin(actorId, interaction.guild.id, targetUser.id);

      const alliance = await AllianceService.getAllianceByLeaderOrOfficer(actorId);
      if (alliance) {
        await targetUser.send(
          `❌ Your request to join **[${alliance.tag}] ${alliance.name}** has been denied.`
        ).catch(() => {});
      }

      await interaction.reply({ content: "✅ You have denied the join request.", ephemeral: true });

    } catch (error: any) {
      await interaction.reply({ content: `❌ Failed to deny join request: ${error.message}`, ephemeral: true });
    }
  }
};

export default DenyCommand;