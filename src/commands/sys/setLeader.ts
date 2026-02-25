// File path: src/commands/sys/setLeader.ts
/**
 * ============================================
 * COMMAND: Set Leader
 * FILE: src/commands/sys/setLeader.ts
 * LAYER: SYSTEM
 * ============================================
 *
 * RESPONSIBILITY:
 * - Assign a new leader to an existing alliance
 * - If an existing leader exists, demote them to R4
 * - Supports identifying alliance by tag or name
 * - Only BotOwner / DiscordOwner can execute
 *
 * NOTES:
 * - Updates the alliance membership and roles
 * - Uses TransferLeaderSystem.setLeader under the hood
 * - Sends confirmation message to the command executor
 *
 * ============================================
 */

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../Command";
import { Ownership } from "../../system/Ownership/Ownership";
import { AllianceSystem } from "../../system/alliance/AllianceSystem";
import { SafeMode } from "../../system/SafeMode";

export const SetLeaderCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("set_leader")
    .setDescription("Assign a leader to an existing alliance (demotes previous leader to R4 if any)")
    .addStringOption(option =>
      option.setName("identifier")
        .setDescription("Alliance tag (3 letters/numbers) or full alliance name")
        .setRequired(true)
    )
    .addUserOption(option =>
      option.setName("leader")
        .setDescription("User to assign as the new leader")
        .setRequired(true)
    ),
  ownerOnly: true,
  systemLayer: true,

  async execute(interaction: ChatInputCommandInteraction) {
    const executorId = interaction.user.id;
    const identifier = interaction.options.getString("identifier", true);
    const newLeader = interaction.options.getUser("leader", true);

    // ----------------- CHECK OWNER -----------------
    if (!Ownership.isBotOwner(executorId) && !Ownership.isDiscordOwner(executorId)) {
      await interaction.reply({ content: "⛔ Only BotOwner or DiscordOwner can execute this command.", ephemeral: true });
      return;
    }

    // ----------------- CHECK SAFE MODE -----------------
    if (SafeMode.isActive()) {
      await interaction.reply({ content: "⛔ System in SAFE_MODE – cannot assign leader.", ephemeral: true });
      return;
    }

    // ----------------- FETCH ALLIANCE -----------------
    const alliance = AllianceSystem.getAllianceByTagOrName(identifier);
    if (!alliance) {
      await interaction.reply({ content: `❌ No alliance found with tag or name \`${identifier}\`.`, ephemeral: true });
      return;
    }

    try {
      // ----------------- SET LEADER SYSTEM -----------------
      // korzystamy z TransferLeaderSystem.setLeader, aby admin/owner mógł wymusić lidera
      await AllianceSystem.setLeaderSystem(alliance, newLeader.id);

      await interaction.reply({
        content: `✅ <@${newLeader.id}> has been assigned as the leader of alliance \`${alliance.tag}\`.`,
        ephemeral: false
      });
    } catch (error: any) {
      await interaction.reply({
        content: `❌ Failed to set leader: ${error.message}`,
        ephemeral: true
      });
    }
  }
};

export default SetLeaderCommand;