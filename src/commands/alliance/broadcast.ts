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

import { ChatInputCommandInteraction, SlashCommandBuilder, GuildMember, GuildChannel } from "discord.js";
import { Command } from "../Command";
import { AllianceManager } from "../../system/alliance/AllianceManager";
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

    const channel = interaction.channel;
    if (!(channel instanceof GuildChannel) || channel.name !== "staff-room") {
      await interaction.reply({ content: "❌ This command can only be used in #staff-room.", ephemeral: true });
      return;
    }

    const member = interaction.member as GuildMember;
    const alliance = await AllianceManager.getAllianceByMember(member.id);
    if (!alliance) {
      await interaction.reply({ content: "❌ You are not a member of any alliance.", ephemeral: true });
      return;
    }

    if (!(alliance.members.r5 === member.id || alliance.members.r4?.includes(member.id))) {
      await interaction.reply({ content: "❌ You do not have permission to use this command.", ephemeral: true });
      return;
    }

    const messageContent = interaction.options.getString("message", true);
    const announceChannelId = ChannelModule.getAnnounceChannel(alliance.id);
    if (!announceChannelId) {
      await interaction.reply({ content: "❌ Could not find the announce channel.", ephemeral: true });
      return;
    }

    try {
      await BroadcastModule.sendCustomMessage(alliance.id, messageContent, member.id);
      await interaction.reply({ content: "✅ Message broadcasted successfully.", ephemeral: true });
    } catch (error: any) {
      await interaction.reply({ content: `❌ Failed to broadcast message: ${error.message}`, ephemeral: true });
    }
  }
};

export default BroadcastCommand;