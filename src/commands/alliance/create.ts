import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../Command";
import { Ownership } from "../../system/Ownership";
import { MutationGate } from "../../engine/MutationGate";
import { AllianceSystem } from "../../system/alliance/AllianceSystem";
import { AllianceRepo } from "../../data/Repositories";

export const AllianceCreateCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("x_alliance_create")
    .setDescription("Create a new alliance (Owner Only)")
    .addStringOption(option =>
      option
        .setName("tag")
        .setDescription("3-character unique alliance tag (letters and numbers only)")
        .setRequired(true)
    )
    .addUserOption(option =>
      option
        .setName("leader")
        .setDescription("User ID of the alliance leader")
        .setRequired(true)
    ),
  ownerOnly: true,

  async execute(interaction: ChatInputCommandInteraction) {
    const userId = interaction.user.id;

    // Weryfikacja BotOwner
    if (!Ownership.isBotOwner(userId)) {
      await interaction.reply({
        content: "⛔ Only Bot Owner can execute this command.",
        ephemeral: true
      });
      return;
    }

    const tag = interaction.options.getString("tag", true).toUpperCase();
    const leaderUser = interaction.options.getUser("leader", true);

    // Walidacja tagu – tylko litery i cyfry
    if (!/^[A-Z0-9]{3}$/.test(tag)) {
      await interaction.reply({
        content: "❌ Alliance tag must be exactly 3 characters: letters (A-Z) or numbers (0-9) only.",
        ephemeral: true
      });
      return;
    }

    // Sprawdzenie unikalności tagu w repo
    if (AllianceRepo.getByTag(tag)) {
      await interaction.reply({
        content: `❌ Alliance tag \`${tag}\` already exists. Please choose a different tag.`,
        ephemeral: true
      });
      return;
    }

    // Atomic execution przez MutationGate
    try {
      const result = await MutationGate.execute(
        {
          operation: "ALLIANCE_CREATE",
          actor: userId,
          requireGlobalLock: true
        },
        async () => {
          const infra = await AllianceSystem.createInfrastructure({
            guild: interaction.guild!,
            tag,
            leaderId: leaderUser.id
          });

          return infra;
        }
      );

      await interaction.reply({
        content: `✅ Alliance created successfully with tag \`${tag}\`.\n` +
                 `R5 Role ID: ${result.roles.r5RoleId}\n` +
                 `Category ID: ${result.channels.categoryId}`,
        ephemeral: false
      });
    } catch (error: any) {
      console.error("Alliance creation error:", error);
      await interaction.reply({
        content: `❌ Failed to create alliance: ${error.message}`,
        ephemeral: true
      });
    }
  }
};