// File path: src/commands/alliance/accept.ts
/**
 * ============================================
 * COMMAND: Accept / Approve
 * FILE: src/commands/alliance/accept.ts
 * LAYER: COMMAND (Alliance)
 * ============================================
 *
 * RESPONSIBILITY:
 * - Accept a user's join request
 * - Only R5 / R4 / leader can approve
 * - Integrates with AllianceOrchestrator
 * - Sends DM to the accepted user
 *
 * NOTES:
 * - Ephemeral reply confirms command usage only
 * - Welcome channel broadcast handled separately
 *
 * ============================================
 */

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../Command";
import { AllianceService } from "../../system/alliance/AllianceService";
import { AllianceOrchestrator } from "../../system/alliance/orchestrator/AllianceOrchestrator";

export const AcceptCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("accept")
    .setDescription("Approve a user's request to join the alliance")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("The user to accept")
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const actorId = interaction.user.id;
    const targetUser = interaction.options.getUser("user", true);

    // 1️⃣ Get alliance for leader/officer
    const alliance = await AllianceService.getAllianceByLeaderOrOfficer(actorId);
    if (!alliance) {
      await interaction.reply({
        content: "❌ You are not a leader or officer of any alliance.",
        ephemeral: true
      });
      return;
    }

    try {
      // 2️⃣ Approve join request atomically
      await AllianceOrchestrator.approveJoin(actorId, alliance.id, targetUser.id);

      // 3️⃣ DM the accepted user
      await targetUser.send(
        `🎉 You have been accepted into **[${alliance.tag}] ${alliance.name}**! Welcome!`
      ).catch(() => { /* ignore DM errors */ });

      // 4️⃣ Ephemeral confirmation (short, command-level only)
      await interaction.reply({
        content: "✅ You have approved the join request.",
        ephemeral: true
      });

    } catch (error: any) {
      await interaction.reply({
        content: `❌ Failed to approve member: ${error.message}`,
        ephemeral: true
      });
    }
  }
};

export default AcceptCommand;