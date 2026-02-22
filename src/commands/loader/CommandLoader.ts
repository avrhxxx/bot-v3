// src/commands/loader/CommandLoader.ts

import fs from "fs";
import path from "path";
import { Command } from "../Command";
import { CommandRegistry } from "../CommandRegistry";

export class CommandLoader {
  /**
   * Ładuje wszystkie komendy z katalogu src/commands i rejestruje je w CommandRegistry.
   */
  static async loadAllCommands(): Promise<void> {
    const commandsDir = path.join(__dirname, ".."); // katalog 'commands'
    
    const walkDir = (dir: string): string[] => {
      let results: string[] = [];
      const list = fs.readdirSync(dir, { withFileTypes: true });
      list.forEach(item => {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
          results = results.concat(walkDir(fullPath));
        } else if (item.isFile() && item.name.endsWith(".ts") && item.name !== "CommandLoader.ts") {
          results.push(fullPath);
        }
      });
      return results;
    };

    const files = walkDir(commandsDir);

    for (const file of files) {
      try {
        const imported = await import(file);
        const command: Command = imported?.default || imported?.[Object.keys(imported)[0]];
        if (command && command.data) {
          CommandRegistry.register(command);
        }
      } catch (err) {
        console.error(`Failed to load command from file ${file}:`, err);
      }
    }

    console.log(`✅ Loaded ${CommandRegistry.count()} commands.`);
  }
}