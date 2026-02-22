import { Collection } from "discord.js";
import { Command } from "./Command";
import { SysSetupCommand } from "./sys/setup"; // importujemy komendę setup

export class CommandRegistry {
  private commands = new Collection<string, Command>();

  constructor() {
    // Rejestracja komendy /x sys setup od razu przy tworzeniu registry
    this.register(SysSetupCommand as unknown as Command); // cast do Command, jeśli potrzebny
  }

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