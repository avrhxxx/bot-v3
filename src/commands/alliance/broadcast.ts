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
 * - Integrates with BroadcastModule
 *
 * NOTES:
 * - Only R5/R4 members can broadcast
 * - Message is sent to the alliance announce channel
 *
 * ============================================
 */

import { ChatInputCommandInteraction } from "discord.js";
import { Command } from "../Command";
import { AllianceSystem } from "../../system/alliance/AllianceSystem";
import { BroadcastModule } from "../../system/alliance/modules/broadcast/BroadcastModule";
import { ChannelModule } from "../../system/alliance/modules/channel/ChannelModule";

export const BroadcastCommand: Command = {
  name: "broadcast",
  description: "Sends a message to all alliance members",
  execute: async (interaction: ChatInputCommandInteraction) => {
    const memberId = interaction.user.id;
    const guild = interaction.guild;

    if (!guild) return;

    // 1️⃣ Get the alliance for the user
    const alliance = await AllianceSystem.getAllianceByMember(memberId);
    if (!alliance) {
      return interaction.reply({ content: "❌ You are not a member of any alliance.", ephemeral: true });
    }

    // 2️⃣ Check permissions (R5/R4)
    if (!alliance.members?.r5?.includes(memberId) && !alliance.members?.r4?.includes(memberId)) {
      return interaction.reply({ content: "❌ You do not have permission to use this command.", ephemeral: true });
    }

    // 3️⃣ Get the message content from the interaction
    const messageContent = interaction.options.getString("message", true);
    if (!messageContent) {
      return interaction.reply({ content: "❌ You must provide a message to send.", ephemeral: true });
    }

    // 4️⃣ Get the announce channel
    const announceChannelId = ChannelModule.getChannelId(alliance.id, "announce");
    const announceChannel = guild.channels.cache.get(announceChannelId);
    if (!announceChannel || !announceChannel.isTextBased()) {
      return interaction.reply({ content: "❌ Could not find the announce channel.", ephemeral: true });
    }

    // 5️⃣ Send the message via BroadcastModule
    await BroadcastModule.broadcast(announceChannel, messageContent, alliance);

    // Note: No ephemeral reply needed, the message is visible in the announce channel
  },
};

export default BroadcastCommand;