// File path: src/commands/alliance/join.ts
/**
 * ============================================
 * COMMAND: Join
 * FILE: src/commands/alliance/join.ts
 * LAYER: COMMAND (Alliance)
 * ============================================
 *
 * RESPONSIBILITY:
 * - Allows a non-member to request joining an alliance
 * - Adds the user to the join queue via AllianceManager
 * - Notifies R5 / R4 / leader about a new request
 * - Sends DM to the user with alliance tag + name
 *
 * NOTES:
 * - Can be used only in #join channel
 * - Member limit validation handled inside Manager
 *
 * ============================================
 */

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../Command";
import { AllianceManager } from "../../system/alliance/AllianceManager";

export const JoinCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("join")
    .setDescription("Submit a request to join an alliance"),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      await interaction.reply({ content: "❌ You cannot join outside a server.", ephemeral: true });
      return;
    }

    if (interaction.channel?.name !== "join") {
      await interaction.reply({ content: "❌ This channel is not a valid #join channel for any alliance.", ephemeral: true });
      return;
    }

    const userId = interaction.user.id;

    const existingAlliance = await AllianceManager.getAllianceByMember(userId);
    if (existingAlliance) {
      await interaction.reply({
        content: `❌ You are already a member of **[${existingAlliance.tag}] ${existingAlliance.name}**.`,
        ephemeral: true
      });
      return;
    }

    try {
      await AllianceManager.requestJoin(userId, interaction.guild.id);

      const alliance = await AllianceManager.getAllianceByGuild(interaction.guild.id);

      await interaction.user.send(
        `✅ Your request to join **[${alliance.tag}] ${alliance.name}** has been submitted and is awaiting approval.`
      ).catch(() => {});

      await interaction.reply({ content: "✅ Join request submitted.", ephemeral: true });

    } catch (error: any) {
      await interaction.reply({ content: `❌ Failed to submit join request: ${error.message}`, ephemeral: true });
    }
  }
};

export default JoinCommand;