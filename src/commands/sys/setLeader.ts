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
 * - Only Shadow Authority can execute
 *
 * NOTES:
 * - Updates alliance membership and roles
 * - Uses AllianceManager.setLeaderSystem under the hood
 * - Authorization handled via Ownership.isAuthority()
 * - SafeMode removed (module no longer exists)
 *
 * ============================================
 */

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../Command";
import { Ownership } from "../../system/Ownership/Ownership";
import { AllianceManager } from "../../system/alliance/AllianceManager"; // <- aktualny import

export const SetLeaderCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("set_leader")
    .setDescription("Assign a leader to an existing alliance (demotes previous leader to R4 if any)")
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

    // 1️⃣ Must be used inside a guild
    if (!interaction.guild) {
      await interaction.reply({
        content: "❌ This command can only be used inside a guild.",
        ephemeral: true
      });
      return;
    }

    // 2️⃣ Shadow Authority authorization
    if (!Ownership.isAuthority(executorId)) {
      await interaction.reply({
        content: "⛔ You do not have permission to use this command.",
        ephemeral: true
      });
      return;
    }

    const identifier = interaction.options.getString("identifier", true);
    const newLeader = interaction.options.getUser("leader", true);

    // 3️⃣ Fetch alliance by tag or name
    const alliance = AllianceManager.getAllianceByTagOrName(identifier, interaction.guild.id);

    if (!alliance) {
      await interaction.reply({
        content: `❌ No alliance found with tag or name \`${identifier}\`.`,
        ephemeral: true
      });
      return;
    }

    try {
      // 4️⃣ Force leader assignment via system method
      await AllianceManager.setLeaderSystem(alliance.id, newLeader.id);

      await interaction.reply({
        content: `✅ <@${newLeader.id}> has been assigned as the leader of alliance \`${alliance.tag}\`.`,
        ephemeral: false
      });

    } catch (error: any) {
      console.error("Set leader system error:", error);

      await interaction.reply({
        content: `❌ Failed to set leader: ${error.message}`,
        ephemeral: true
      });
    }
  }
};

export default SetLeaderCommand;