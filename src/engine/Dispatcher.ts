import { ChatInputCommandInteraction } from "discord.js";
import { CommandRegistry } from "../commands/CommandRegistry";
import { SafeMode } from "../system/SafeMode";
import { Health } from "../system/Health";
import { Journal } from "../journal/Journal";
import { Ownership } from "../system/Ownership";

export class Dispatcher {
  constructor(private registry: CommandRegistry) {}

  async dispatch(interaction: ChatInputCommandInteraction) {
    try {
      // 1️⃣ SafeMode guard
      if (SafeMode.isActive()) {
        await interaction.reply({
          content: "⚠️ System is in SafeMode. Commands temporarily disabled.",
          ephemeral: true
        });
        return;
      }

      // 2️⃣ Health guard
      const health = Health.get();
      if (health.state === "CRITICAL") {
        await interaction.reply({
          content: "🚨 System is in CRITICAL state. Try again later.",
          ephemeral: true
        });
        return;
      }

      const command = this.registry.get(interaction.commandName);

      if (!command) {
        await interaction.reply({
          content: "❌ Command not found.",
          ephemeral: true
        });
        return;
      }

      // 3️⃣ OwnerGuard
      if (command.ownerOnly) {
        const userId = interaction.user.id;

        // ✅ Sprawdzamy zarówno BotOwner, jak i DiscordOwner
        if (!Ownership.isBotOwner(userId) && !Ownership.isDiscordOwner(userId)) {
          await interaction.reply({
            content: "⛔ This command is restricted to Bot or Discord Owner.",
            ephemeral: true
          });
          return;
        }
      }

      await command.execute(interaction);

    } catch (error: any) {
      console.error("Dispatch error:", error);

      Journal.create({
        operation: "COMMAND_EXECUTION_FAILED",
        actor: interaction.user?.id ?? "UNKNOWN",
        timestamp: Date.now(),
        allianceId: undefined
      });

      if (!interaction.replied) {
        await interaction.reply({
          content: "❌ Unexpected error occurred.",
          ephemeral: true
        });
      }
    }
  }
}