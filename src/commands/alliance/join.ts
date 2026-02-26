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
 * - Restricts command usage to join channels only
 *
 * ============================================
 */

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../Command";
import { AllianceOrchestrator } from "../../system/alliance/orchestrator/AllianceOrchestrator";
import { AllianceService } from "../../system/alliance/AllianceService";
import { ChannelModule } from "../../system/alliance/channel/ChannelModule";

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

    const guildId = interaction.guild.id;
    const channelId = interaction.channelId;

    // ----------------- Weryfikacja kanału join -----------------
    const isJoinChannel = Object.values(ChannelModule["channels"][guildId] || {})
      .some(id => id === channelId);

    if (!isJoinChannel) {
      await interaction.reply({
        content: "❌ This channel is not a valid #join channel for any alliance.",
        ephemeral: true
      });
      return;
    }

    // ----------------- Sprawdzenie, czy użytkownik już jest w sojuszu -----------------
    const existingAllianceId = AllianceService.getAllianceByMember(userId);
    if (existingAllianceId) {
      const existingAlliance = AllianceService.getAllianceOrThrow(existingAllianceId);
      await interaction.reply({
        content: `❌ You are already a member of **[${existingAlliance.tag}] ${existingAlliance.name}**.`,
        ephemeral: true
      });
      return;
    }

    try {
      // 1️⃣ Submit join request atomically
      await AllianceOrchestrator.requestJoin(userId, guildId, channelId);

      // 2️⃣ Fetch alliance data for DM context
      const alliance = AllianceService.getAllianceByJoinChannel(channelId);
      if (!alliance) throw new Error("Alliance not found for this join channel.");

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