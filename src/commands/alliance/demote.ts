// File path: src/commands/alliance/demote.ts
/**
 * ============================================
 * COMMAND: Demote
 * FILE: src/commands/alliance/demote.ts
 * LAYER: COMMAND (Alliance)
 * ============================================
 *
 * RESPONSIBILITY:
 * - Demote a member to a lower rank (R5 → R4 → R3)
 * - Only leader / R5 can demote
 * - Can be used only in #staff-room
 *
 * ============================================
 */

import { ChatInputCommandInteraction, SlashCommandBuilder, GuildMember, GuildChannel } from "discord.js";
import { Command } from "../Command";
import { AllianceManager } from "../../system/alliance/AllianceManager";

export const DemoteCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("demote")
    .setDescription("Demote a member to a lower rank in your alliance")
    .addUserOption(option =>
      option
        .setName("member")
        .setDescription("Member to demote")
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const channel = interaction.channel;
    if (!(channel instanceof GuildChannel) || channel.name !== "staff-room") {
      await interaction.reply({
        content: "❌ This command can only be used in #staff-room.",
        ephemeral: true
      });
      return;
    }

    const actor = interaction.member as GuildMember;
    const targetUser = interaction.options.getUser("member", true);

    try {
      await AllianceManager.demoteMember(actor.id, targetUser.id, interaction.guild.id);
      await interaction.reply({
        content: `✅ <@${targetUser.id}> has been demoted in the alliance.`,
        ephemeral: false
      });
    } catch (error: any) {
      await interaction.reply({ content: `❌ Failed to demote member: ${error.message}`, ephemeral: true });
    }
  }
};

export default DemoteCommand;