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
 * - Adds the user to the join queue in MembershipModule
 * - Notifies R5 / R4 / leader about a new request
 *
 * NOTES:
 * - Checks if the user is already in an alliance
 * - Validates alliance member limits
 * - Sends a DM notification to the user
 *
 * ============================================
 */

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../Command";
import { MembershipModule } from "../../system/alliance/modules/membership/MembershipModule";
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
      // Check if the user is already in an alliance
      const existingAlliance = await AllianceService.getAllianceByMember(userId, interaction.guild.id);
      if (existingAlliance) {
        await interaction.reply({ content: "❌ You are already in an alliance.", ephemeral: true });
        return;
      }

      // Validate alliance member limit
      const totalMembers = await AllianceService.getTotalMembers(interaction.guild.id);
      if (totalMembers >= 100) {
        await interaction.reply({ content: "❌ Alliance member limit reached.", ephemeral: true });
        return;
      }

      // Add request to join queue
      await MembershipModule.addJoinRequest(userId, interaction.guild.id);

      // Notify the user
      await interaction.user.send("✅ Your request to join the alliance has been submitted and is awaiting approval.");

      await interaction.reply({ content: "✅ Request submitted.", ephemeral: true });
    } catch (error: any) {
      await interaction.reply({ content: `❌ Failed to submit request: ${error.message}`, ephemeral: true });
    }
  },
};

export default JoinCommand;