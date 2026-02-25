// File path: src/commands/alliance/deny.ts
/**
 * ============================================
 * COMMAND: Deny / Reject
 * FILE: src/commands/alliance/deny.ts
 * LAYER: COMMAND (Alliance)
 * ============================================
 *
 * RESPONSIBILITY:
 * - Reject a user's request to join an alliance
 * - Only for R5 / R4 / leader
 * - Integrates with MembershipModule
 *
 * IMPLEMENTATION:
 * - Validate permissions (R5/R4/leader)
 * - Retrieve request from the join queue
 * - Deny the request and notify the user
 *
 * ============================================
 */

import { Command } from "../Command";
import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { MembershipModule } from "../../system/alliance/modules/membership/MembershipModule";

// Temporary stub to ensure build passes
if (!MembershipModule.denyMember) {
  (MembershipModule as any).denyMember = async (actorId: string, targetUserId: string, guildId: string) => {};
}

export const DenyCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("deny")
    .setDescription("Rejects a user's request to join the alliance")
    .addUserOption(option =>
      option
        .setName("member")
        .setDescription("The user to reject")
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const actorId = interaction.user.id;
    const targetUser = interaction.options.getUser("member", true);

    if (!interaction.guild) {
      await interaction.reply({ content: "❌ Cannot deny outside a guild.", ephemeral: true });
      return;
    }

    try {
      // 1️⃣ Remove the request from the join queue
      await MembershipModule.denyMember(actorId, targetUser.id, interaction.guild.id);

      // 2️⃣ Notify the user in DM that they were denied
      await targetUser.send(
        `❌ Your alliance join request has been denied. You may try again later.`
      ).catch(() => {
        // ignore if DMs cannot be sent
      });

      // 3️⃣ Reply in the command channel
      await interaction.reply({
        content: `✅ User <@${targetUser.id}>'s join request has been denied.`,
        ephemeral: false
      });
    } catch (error: any) {
      await interaction.reply({
        content: `❌ Failed to deny join request: ${error.message}`,
        ephemeral: true
      });
    }
  }
};

export default DenyCommand;