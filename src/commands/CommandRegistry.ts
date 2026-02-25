// File path: src/commands/CommandRegistry.ts
// fillpatch: Central registry storing all loaded commands

import { Collection } from "discord.js";
import { Command } from "./Command";

/**
 * Central registry storing all loaded commands.
 * Commands are registered dynamically by CommandLoader.
 *
 * This class ensures:
 * - Only valid commands with a defined `data.name` are registered.
 * - Provides retrieval by name or all commands.
 * - Tracks total number of registered commands.
 */
export class CommandRegistry {
  // Internal static storage of commands, keyed by command name
  private static commands = new Collection<string, Command>();

  /**
   * Register a command into the system.
   * Validates the command before adding.
   *
   * @param command - Command object implementing `Command` interface
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
   *
   * @param name - Name of the command to fetch
   * @returns Command object or undefined if not found
   */
  static get(name: string): Command | undefined {
    return this.commands.get(name);
  }

  /**
   * Retrieve all registered commands as an array.
   *
   * @returns Array of Command objects
   */
  static getAll(): Command[] {
    return [...this.commands.values()];
  }

  /**
   * Get total number of registered commands.
   *
   * @returns Number of commands registered
   */
  static count(): number {
    return this.commands.size;
  }
}