import { Collection } from "discord.js";
import { Command } from "./Command";

export class CommandRegistry {
  private commands = new Collection<string, Command>();

  register(command: Command) {
    this.commands.set(command.data.name, command);
  }

  get(name: string): Command | undefined {
    return this.commands.get(name);
  }

  getAll(): Command[] {
    return [...this.commands.values()];
  }
}