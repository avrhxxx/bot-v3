// File path: src/commands/alliance/broadcast.ts
/**
 * ============================================
 * COMMAND: Broadcast
 * FILE: src/commands/alliance/broadcast.ts
 * LAYER: COMMAND (Alliance)
 * ============================================
 *
 * RESPONSIBILITY:
 * - Send a message to all alliance members
 * - Only R5 / R4 can broadcast
 * - Must be used in #staff-room
 *
 * ============================================
 */

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../Command";
import { AllianceService } from "../../system/alliance/AllianceService";
import { BroadcastModule } from "../../system/alliance/modules/broadcast/BroadcastModule";
import { ChannelModule } from "../../system/alliance/modules/channel/ChannelModule";

export const BroadcastCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("broadcast")
    .setDescription("Send a message to all alliance members")
    .addStringOption(option =>
      option.setName("message")
        .setDescription("Message to send")
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

    const memberId = interaction.user.id;

    // 1️⃣ Get the alliance of the member
    const alliance = await AllianceService.getAllianceByMember(memberId);
    if (!alliance) {
      await interaction.reply({ content: "❌ You are not a member of any alliance.", ephemeral: true });
      return;
    }

    // 2️⃣ Check if member is R5 / R4
    if (!(alliance.members.r5 === memberId || alliance.members.r4?.includes(memberId))) {
      await interaction.reply({ content: "❌ You do not have permission to use this command.", ephemeral: true });
      return;
    }

    const messageContent = interaction.options.getString("message", true);

    // 3️⃣ Get the announce channel
    const announceChannelId = ChannelModule.getAnnounceChannel(alliance.id);
    if (!announceChannelId) {
      await interaction.reply({ content: "❌ Could not find the announce channel.", ephemeral: true });
      return;
    }

    try {
      await BroadcastModule.sendCustomMessage(alliance.id, messageContent, memberId);
    } catch (error: any) {
      await interaction.reply({ content: `❌ Failed to broadcast message: ${error.message}`, ephemeral: true });
    }
  }
};

export default BroadcastCommand;