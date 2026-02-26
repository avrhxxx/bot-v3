// File path: src/commands/sys/globalBroadcast.ts
/**
 * ============================================
 * COMMAND: Global Broadcast
 * FILE: src/commands/sys/globalBroadcast.ts
 * LAYER: SYSTEM
 * ============================================
 *
 * RESPONSIBILITY:
 * - Sends a global message as bot to a specific guild channel
 * - Only users defined in Ownership.AUTHORITY_IDS can execute
 * - Uses environment variable GLOBAL_CHAT_CHANNEL_ID for the target channel
 *
 * NOTES:
 * - Minimal system-level command
 * - Owner-only / authority-only access
 *
 * ============================================
 */

import { ChatInputCommandInteraction, SlashCommandBuilder, TextChannel } from "discord.js";
import { Command } from "../Command";
import { Ownership } from "../../system/Ownership/Ownership";

export const GlobalBroadcastCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("global_broadcast")
    .setDescription("Send a message as bot to the global chat channel (Authority Only)")
    .addStringOption(option =>
      option
        .setName("message")
        .setDescription("Message to broadcast")
        .setRequired(true)
    ),
  ownerOnly: true, // zgodnie z planem systemowych komend

  async execute(interaction: ChatInputCommandInteraction) {
    const userId = interaction.user.id;

    if (!interaction.guild) {
      await interaction.reply({ content: "❌ This command can only be used inside a guild.", ephemeral: true });
      return;
    }

    // ✅ Sprawdzenie authority
    if (!Ownership.isAuthority(userId)) {
      await interaction.reply({ content: "⛔ You do not have permission to use this command.", ephemeral: true });
      return;
    }

    const messageContent = interaction.options.getString("message", true);
    const channelId = process.env.GLOBAL_CHAT_CHANNEL_ID;

    if (!channelId) {
      await interaction.reply({ content: "❌ Global chat channel ID is not set in environment.", ephemeral: true });
      return;
    }

    const targetChannel = interaction.guild.channels.cache.get(channelId) as TextChannel | undefined;

    if (!targetChannel) {
      await interaction.reply({ content: "❌ Could not find the global chat channel in this guild.", ephemeral: true });
      return;
    }

    try {
      await targetChannel.send(messageContent);
      await interaction.reply({ content: "✅ Message broadcasted globally.", ephemeral: true });
    } catch (error: any) {
      await interaction.reply({ content: `❌ Failed to send message: ${error.message}`, ephemeral: true });
    }
  }
};

export default GlobalBroadcastCommand;