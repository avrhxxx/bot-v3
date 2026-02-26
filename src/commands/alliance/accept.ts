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
 * - Can be used only in #staff-room
 * - Sends DM to the accepted user
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
    if (!interaction.guild) return;

    // ✅ Ensure command is used in #staff-room
    if (interaction.channel?.name !== "staff-room") {
      await interaction.reply({
        content: "❌ This command can only be used in #staff-room.",
        ephemeral: true
      });
      return;
    }

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
      // 2️⃣ Approve join request
      await AllianceOrchestrator.approveJoin(actorId, alliance.id, targetUser.id);

      // 3️⃣ DM the accepted user
      await targetUser.send(
        `🎉 You have been accepted into **[${alliance.tag}] ${alliance.name}**! Welcome!`
      ).catch(() => {});

      // 4️⃣ Ephemeral confirmation
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