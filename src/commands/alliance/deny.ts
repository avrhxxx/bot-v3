// File path: src/commands/alliance/deny.ts
/**
 * ============================================
 * COMMAND: Deny / Reject
 * FILE: src/commands/alliance/deny.ts
 * LAYER: COMMAND (Alliance)
 * ============================================
 *
 * RESPONSIBILITY:
 * - Reject a user's join request
 * - Only R5 / R4 / leader can deny
 * - Can be used only in #staff-room
 * - Sends DM to the denied user
 *
 * ============================================
 */

import { Command } from "../Command";
import { ChatInputCommandInteraction, SlashCommandBuilder, GuildChannel, GuildMember } from "discord.js";
import { AllianceManager } from "../../system/alliance/AllianceManager";

export const DenyCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("deny")
    .setDescription("Reject a user's request to join the alliance")
    .addUserOption(option =>
      option
        .setName("member")
        .setDescription("The user to reject")
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
      const alliance = await AllianceManager.getAllianceByMember(actor.id);
      if (!alliance) {
        await interaction.reply({ content: "❌ You are not part of any alliance.", ephemeral: true });
        return;
      }

      await AllianceManager.denyJoinRequest(actor.id, alliance.id, targetUser.id);

      await targetUser.send(
        `❌ Your request to join **[${alliance.tag}] ${alliance.name}** has been denied.`
      ).catch(() => {});

      await interaction.reply({ content: "✅ You have denied the join request.", ephemeral: true });

    } catch (error: any) {
      await interaction.reply({ content: `❌ Failed to deny join request: ${error.message}`, ephemeral: true });
    }
  }
};

export default DenyCommand;