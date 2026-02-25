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
 * - Integrates with AllianceOrchestrator
 * - Sends DM to the denied user
 *
 * NOTES:
 * - Ephemeral reply confirms command usage only
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
    const actorId = interaction.user.id;
    const targetUser = interaction.options.getUser("member", true);

    if (!interaction.guild) {
      await interaction.reply({
        content: "❌ Cannot deny outside a guild.",
        ephemeral: true
      });
      return;
    }

    try {
      // 1️⃣ Deny join request atomically
      await AllianceOrchestrator.denyJoin(actorId, interaction.guild.id, targetUser.id);

      // 2️⃣ Fetch alliance for DM context
      const alliance = await AllianceService.getAllianceByLeaderOrOfficer(actorId);

      if (alliance) {
        await targetUser.send(
          `❌ Your request to join **[${alliance.tag}] ${alliance.name}** has been denied.`
        ).catch(() => { /* ignore DM errors */ });
      }

      // 3️⃣ Ephemeral confirmation (short)
      await interaction.reply({
        content: "✅ You have denied the join request.",
        ephemeral: true
      });

    } catch (error: any) {
      await interaction.reply({
        content: `❌ Failed to deny join request: ${error.message}`,
        ephemeral: true
      });
    }
  }
};

export default DenyCommand;