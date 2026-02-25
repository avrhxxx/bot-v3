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
 * - Fetches pending join request
 * - Assigns the user to the alliance atomically
 * - Updates Discord roles
 * - Broadcasts acceptance to the alliance
 *
 * ============================================
 */

import { ChatInputCommandInteraction } from "discord.js";
import { Command } from "../Command";
import { AllianceService } from "../../system/alliance/AllianceService";
import { AllianceOrchestrator } from "../../system/alliance/orchestrator/AllianceOrchestrator";

export const AcceptCommand: Command = {
  name: "accept",
  description: "Accepts a user's request to join the alliance",
  execute: async (interaction: ChatInputCommandInteraction) => {
    const actorId = interaction.user.id;

    // 1️⃣ Get the alliance for the user (leader/officer)
    const alliance = await AllianceService.getAllianceByLeaderOrOfficer(actorId);
    if (!alliance) {
      await interaction.reply({
        content: "❌ You are not a leader or officer of any alliance.",
        ephemeral: true,
      });
      return;
    }

    // 2️⃣ Get the pending join request
    const joinRequest = await AllianceService.getPendingRequest(alliance.id);
    if (!joinRequest) {
      await interaction.reply({
        content: "❌ No pending join requests to approve.",
        ephemeral: true,
      });
      return;
    }

    try {
      // 3️⃣ Atomically approve via AllianceOrchestrator
      await AllianceOrchestrator.approveJoin(actorId, alliance.id, joinRequest.userId);

      // 4️⃣ Reply to the actor
      await interaction.reply({
        content: `✅ You have accepted <@${joinRequest.userId}> into the alliance ${alliance.tag}.`,
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