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
 * - Adds the user to the join queue via AllianceOrchestrator
 * - Notifies R5 / R4 / leader about a new request
 * - Sends DM to the user with alliance tag + name
 *
 * NOTES:
 * - SafeMode blocks new join requests
 * - Member limit validation handled inside Orchestrator
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
      await interaction.reply({
        content: "❌ You cannot join outside a server.",
        ephemeral: true
      });
      return;
    }

    if (SafeMode.isActive()) {
      await interaction.reply({
        content: "⛔ System in SAFE_MODE – cannot join an alliance.",
        ephemeral: true
      });
      return;
    }

    try {
      const guildId = interaction.guild.id;

      // 1️⃣ Submit join request atomically
      await AllianceOrchestrator.requestJoin(userId, guildId);

      // 2️⃣ Fetch alliance data for DM context
      const alliance = AllianceService.getAllianceOrThrow(guildId);

      // 3️⃣ DM the user with alliance tag + name
      await interaction.user.send(
        `✅ Your request to join **[${alliance.tag}] ${alliance.name}** has been submitted and is awaiting approval.`
      ).catch(() => { /* ignore DM errors */ });

      // 4️⃣ Ephemeral confirmation
      await interaction.reply({
        content: "✅ Join request submitted.",
        ephemeral: true
      });

    } catch (error: any) {
      await interaction.reply({
        content: `❌ Failed to submit join request: ${error.message}`,
        ephemeral: true
      });
    }
  }
};

export default JoinCommand;