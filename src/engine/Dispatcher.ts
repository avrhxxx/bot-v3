import { ChatInputCommandInteraction } from "discord.js";
import { CommandRegistry } from "../commands/CommandRegistry";

export class Dispatcher {
  constructor(private registry: CommandRegistry) {}

  async dispatch(interaction: ChatInputCommandInteraction) {
    const command = this.registry.get(interaction.commandName);

    if (!command) {
      await interaction.reply({
        content: "❌ Command not found.",
        ephemeral: true
      });
      return;
    }

    await command.execute(interaction);
  }
}