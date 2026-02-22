// File path: src/commands/sys/setLeader.ts

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../Command";
import { Ownership } from "../../system/Ownership";
import { AllianceSystem } from "../../system/alliance/AllianceSystem";
import { SafeMode } from "../../system/SafeMode";

export const Command: Command = {
  data: new SlashCommandBuilder()
    .setName("set_leader")
    .setDescription("System command: Assign a leader to a newly created alliance")
    .addStringOption(option =>
      option
        .setName("tag")
        .setDescription("3-character tag of the alliance")
        .setRequired(true)
    )
    .addUserOption(option =>
      option
        .setName("leader")
        .setDescription("User to assign as leader")
        .setRequired(true)
    ),
  ownerOnly: true,
  systemLayer: true,

  async execute(interaction: ChatInputCommandInteraction) {
    const userId = interaction.user.id;

    if (!Ownership.isBotOwner(userId) && !Ownership.isDiscordOwner(userId)) {
      await interaction.reply({ content: "⛔ Only BotOwner or DiscordOwner can execute this command.", ephemeral: true });
      return;
    }

    if (SafeMode.isActive()) {
      await interaction.reply({ content: "⛔ System in SAFE_MODE – cannot set leader.", ephemeral: true });
      return;
    }

    const tag = interaction.options.getString("tag", true).toUpperCase();
    const newLeader = interaction.options.getUser("leader", true);

    try {
      await AllianceSystem.setLeaderSystem(tag, newLeader.id);
      await interaction.reply({ content: `✅ <@${newLeader.id}> has been assigned as the leader of alliance \`${tag}\`.`, ephemeral: false });
    } catch (error: any) {
      await interaction.reply({ content: `❌ Failed to set leader: ${error.message}`, ephemeral: true });
    }
  }
};

export default Command;