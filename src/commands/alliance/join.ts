// File path: src/commands/alliance/join.ts
/**
 * ============================================
 * COMMAND: Join
 * FILE: src/commands/alliance/join.ts
 * LAYER: COMMAND (Alliance)
 * ============================================
 *
 * RESPONSIBILITY:
 * - Allows a user to request joining an alliance
 * - Adds the user to the join queue in AllianceOrchestrator
 * - Notifies R5 / R4 / leader about a new request
 *
 * NOTES:
 * - Checks if the user is already in an alliance
 * - Validates alliance member limits
 * - Sends a DM notification to the user with alliance tag + name
 *
 * ============================================
 */

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../Command";
import { AllianceOrchestrator } from "../../system/alliance/orchestrator/AllianceOrchestrator";
import { AllianceService } from "../../system/alliance/AllianceService";
import { SafeMode } from "../../system/SafeMode";

export const JoinCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("join")
    .setDescription("Submit a request to join an alliance"),

  async execute(interaction: ChatInputCommandInteraction) {
    const userId = interaction.user.id;

    if (!interaction.guild) {
      await interaction.reply({ content: "❌ You cannot join outside a server.", ephemeral: true });
      return;
    }

    if (SafeMode.isActive()) {
      await interaction.reply({ content: "⛔ System in SAFE_MODE – cannot join an alliance.", ephemeral: true });
      return;
    }

    try {
      // 1️⃣ Use Orchestrator to submit join request atomically
      await AllianceOrchestrator.requestJoin(userId, interaction.guild.id);

      // 2️⃣ Fetch alliance info for DM
      const alliance = AllianceService.getAllianceByMember(userId)
                       || AllianceService.getAllianceByLeaderOrOfficer(userId);

      // 3️⃣ Notify the user via DM
      if (alliance) {
        await interaction.user.send(
          `✅ Your request to join **[${alliance.tag}] ${alliance.name}** has been submitted and is awaiting approval.`
        ).catch(() => {}); // ignore DM failures
      }

      // 4️⃣ Confirm usage via ephemeral reply
      await interaction.reply({ content: "✅ Request submitted.", ephemeral: true });
    } catch (error: any) {
      await interaction.reply({
        content: `❌ Failed to submit request: ${error.message}`,
        ephemeral: true,
      });
    }
  },
};

export default JoinCommand;