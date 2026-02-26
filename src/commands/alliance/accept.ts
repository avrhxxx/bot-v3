// File path: src/commands/alliance/accept.ts
/**
 * ============================================
 * COMMAND: Accept / Approve
 * FILE: src/commands/alliance/accept.ts
 * LAYER: COMMAND (Alliance)
 * ============================================
 *
 * RESPONSIBILITY:
 * - Accept a user's join request
 * - Only R5 / R4 / leader can approve
 * - Can be used only in #staff-room
 * - Sends DM to the accepted user
 *
 * ============================================
 */

import { ChatInputCommandInteraction, SlashCommandBuilder, GuildMember, GuildChannel } from "discord.js";
import { Command } from "../Command";
import { AllianceManager } from "../../system/alliance/AllianceManager";

export const AcceptCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("accept")
    .setDescription("Approve a user's request to join the alliance")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("The user to accept")
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const channel = interaction.channel;
    if (!(channel instanceof GuildChannel) || channel.name !== "staff-room") {
      await interaction.reply({ content: "❌ This command can only be used in #staff-room.", ephemeral: true });
      return;
    }

    const actor = interaction.member as GuildMember;
    const targetUser = interaction.options.getMember("user", true) as GuildMember;

    const alliance = await AllianceManager.getAllianceByLeaderOrOfficer(actor.id);
    if (!alliance) {
      await interaction.reply({ content: "❌ You are not a leader or officer of any alliance.", ephemeral: true });
      return;
    }

    try {
      await AllianceManager.approveJoin(actor.id, alliance.id, targetUser.id);

      await targetUser.send(
        `🎉 You have been accepted into **[${alliance.tag}] ${alliance.name}**! Welcome!`
      ).catch(() => {});

      await interaction.reply({ content: "✅ You have approved the join request.", ephemeral: true });

    } catch (error: any) {
      await interaction.reply({ content: `❌ Failed to approve member: ${error.message}`, ephemeral: true });
    }
  }
};

export default AcceptCommand;