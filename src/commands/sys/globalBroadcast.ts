// File path: src/commands/sys/globalBroadcast.ts
/**
 * ============================================
 * COMMAND: Global Broadcast
 * FILE: src/commands/sys/globalBroadcast.ts
 * LAYER: SYSTEM
 * ============================================
 *
 * RESPONSIBILITY:
 * - Send a broadcast message to the server-wide global chat channel
 * - Only users listed in AUTHORITY_IDS (Ownership.ts) can execute
 * - Channel ID for global chat is provided via environment variable
 *
 * NOTES:
 * - System-level owner-only command
 * - Ensures proper typing for Guild and TextChannel
 *
 * ============================================
 */

import { ChatInputCommandInteraction, SlashCommandBuilder, TextChannel } from "discord.js";
import { Command } from "../Command";
import { Ownership } from "../../system/Ownership/Ownership";

export const GlobalBroadcastCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("global_broadcast")
    .setDescription("Send a message to the global chat (Owner Only)")
    .addStringOption(option =>
      option
        .setName("message")
        .setDescription("Message to broadcast globally")
        .setRequired(true)
    ),
  ownerOnly: true,
  systemLayer: true,

  async execute(interaction: ChatInputCommandInteraction) {
    const userId = interaction.user.id;

    // 1️⃣ Sprawdzenie uprawnień
    if (!Ownership.isAuthority(userId)) {
      await interaction.reply({
        content: "⛔ You are not authorized to use this command.",
        ephemeral: true
      });
      return;
    }

    // 2️⃣ Sprawdzenie, czy komenda jest w guildzie
    if (!interaction.guild) {
      await interaction.reply({
        content: "❌ This command can only be used in a server.",
        ephemeral: true
      });
      return;
    }

    // 3️⃣ Pobranie wiadomości
    const message = interaction.options.getString("message", true);

    // 4️⃣ Pobranie ID kanału z ENV
    const channelId = process.env.GLOBAL_BROADCAST_CHANNEL_ID;
    if (!channelId) {
      await interaction.reply({
        content: "❌ Global broadcast channel ID is not set in environment variables.",
        ephemeral: true
      });
      return;
    }

    // 5️⃣ Pobranie kanału z cache klienta
    const channel = interaction.guild.channels.cache.get(channelId);
    if (!channel || !(channel instanceof TextChannel)) {
      await interaction.reply({
        content: "❌ Could not find the global broadcast channel in this server or channel type is invalid.",
        ephemeral: true
      });
      return;
    }

    try {
      // 6️⃣ Wysłanie wiadomości jako bot
      await channel.send(message);

      // 7️⃣ Potwierdzenie wysłania
      await interaction.reply({
        content: `✅ Message has been broadcasted successfully to <#${channel.id}>.`,
        ephemeral: true
      });
    } catch (error: any) {
      console.error("Global broadcast error:", error);
      await interaction.reply({
        content: `❌ Failed to send broadcast: ${error.message}`,
        ephemeral: true
      });
    }
  }
};

export default GlobalBroadcastCommand;