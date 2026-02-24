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
 * - If an existing leader exists, demote them to R3
 * - Supports identifying alliance by tag or name
 * - Only BotOwner / DiscordOwner can execute
 *
 * NOTES:
 * - Updates the alliance membership and roles
 * - Sends confirmation message to the command executor
 *
 * ============================================
 */

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../Command";
import { Ownership } from "../../system/Ownership";
import { AllianceSystem } from "../../system/alliance/AllianceSystem";
import { SafeMode } from "../../system/SafeMode";

export const SetLeaderCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("set_leader")
    .setDescription("Assign a leader to an existing alliance (demotes previous leader if any)")
    .addStringOption(option =>
      option
        .setName("identifier")
        .setDescription("Alliance tag (3 letters/numbers) or full alliance name")
        .setRequired(true)
    )
    .addUserOption(option =>
      option
        .setName("leader")
        .setDescription("User to assign as the new leader")
        .setRequired(true)
    ),
  ownerOnly: true,
  systemLayer: true,

  async execute(interaction: ChatInputCommandInteraction) {
    const executorId = interaction.user.id;
    const identifier = interaction.options.getString("identifier", true);
    const newLeader = interaction.options.getUser("leader", true);

    // 1️⃣ Permissions check
    if (!Ownership.isBotOwner(executorId) && !Ownership.isDiscordOwner(executorId)) {
      await interaction.reply({ content: "⛔ Only BotOwner or DiscordOwner can execute this command.", ephemeral: true });
      return;
    }

    // 2️⃣ SafeMode check
    if (SafeMode.isActive()) {
      await interaction.reply({ content: "⛔ System in SAFE_MODE – cannot assign leader.", ephemeral: true });
      return;
    }

    // 3️⃣ Retrieve alliance by tag or name
    const alliance = AllianceSystem.getAllianceByTagOrName(identifier);
    if (!alliance) {
      await interaction.reply({ content: `❌ No alliance found with tag or name \`${identifier}\`.`, ephemeral: true });
      return;
    }

    try {
      // 4️⃣ Assign new leader, demote previous leader to R3 if exists
      await AllianceSystem.setLeaderSystem(alliance, newLeader.id);

      await interaction.reply({
        content: `✅ <@${newLeader.id}> has been assigned as the leader of alliance \`${alliance.tag}\`.`,
        ephemeral: false
      });
    } catch (error: any) {
      await interaction.reply({ content: `❌ Failed to set leader: ${error.message}`, ephemeral: true });
    }
  }
};

export default SetLeaderCommand;