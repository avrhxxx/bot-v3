// File path: src/commands/alliance/accept.ts
/**
 * ============================================
 * COMMAND: Accept / Approve
 * FILE: src/commands/alliance/accept.ts
 * LAYER: COMMAND (Alliance)
 * ============================================
 *
 * RESPONSIBILITY:
 * - Accept a user's request to join the alliance
 * - Only R5 / R4 / leader can approve
 * - Integrates with MembershipModule via AllianceOrchestrator
 *
 * NOTES:
 * - Checks the leader/officer permissions
 * - Accepts the user directly (no pending fetch)
 * - Assigns the user to the alliance atomically
 * - Updates Discord roles
 * - Broadcasts acceptance to the alliance
 *
 * ============================================
 */

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../Command";
import { AllianceService } from "../../system/alliance/AllianceService";
import { AllianceOrchestrator } from "../../system/alliance/orchestrator/AllianceOrchestrator";

export const AcceptCommand: Command = {
  name: "accept",
  description: "Accepts a user into your alliance",
  data: new SlashCommandBuilder()
    .setName("accept")
    .setDescription("Accepts a user into your alliance")
    .addUserOption(option =>
      option.setName("user")
            .setDescription("The user to accept")
            .setRequired(true)
    ),
  execute: async (interaction: ChatInputCommandInteraction) => {
    const actorId = interaction.user.id;
    const targetUser = interaction.options.getUser("user");

    if (!targetUser) {
      await interaction.reply({
        content: "❌ You must specify a user to accept.",
        ephemeral: true,
      });
      return;
    }

    // 1️⃣ Get the alliance for the actor (leader/officer)
    const alliance = await AllianceService.getAllianceByLeaderOrOfficer(actorId);
    if (!alliance) {
      await interaction.reply({
        content: "❌ You are not a leader or officer of any alliance.",
        ephemeral: true,
      });
      return;
    }

    try {
      // 2️⃣ Atomically accept the user via Orchestrator
      await AllianceOrchestrator.approveJoin(actorId, alliance.id, targetUser.id);

      // 3️⃣ Reply to the actor
      await interaction.reply({
        content: `✅ You have accepted <@${targetUser.id}> into the alliance ${alliance.tag}.`,
        ephemeral: true,
      });
    } catch (error: any) {
      await interaction.reply({
        content: `❌ Failed to approve member: ${error.message}`,
        ephemeral: true,
      });
    }
  },
};

export default AcceptCommand;