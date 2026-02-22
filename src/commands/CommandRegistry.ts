// File path: src/commands/CommandRegistry.ts

import { Collection } from "discord.js";
import { Command } from "./Command";

/**
 * Central registry storing all loaded commands.
 * Commands are registered dynamically by CommandLoader.
 */
export class CommandRegistry {
  private static commands = new Collection<string, Command>();

  /**
   * Register a command into the system.
   */
  static register(command: Command): void {
    if (!command?.data?.name) {
      console.warn("⚠️ Attempted to register invalid command:", command);
      return;
    }

    this.commands.set(command.data.name, command);
  }

  /**
   * Retrieve a command by its name.
   */
  static get(name: string): Command | undefined {
    return this.commands.get(name);
  }

  /**
   * Retrieve all registered commands.
   */
  static getAll(): Command[] {
    return [...this.commands.values()];
  }

  /**
   * Get total number of registered commands.
   */
  static count(): number {
    return this.commands.size;
  }
}