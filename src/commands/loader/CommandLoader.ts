// File path: src/commands/loader/CommandLoader.ts

import fs from "fs";
import path from "path";
import { Command } from "../Command";
import { CommandRegistry } from "../CommandRegistry";

export class CommandLoader {
  static async loadAllCommands(): Promise<void> {
    const commandsDir = path.resolve(__dirname, ".."); 

    const walkDir = (dir: string): string[] => {
      let results: string[] = [];
      const list = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of list) {
        const fullPath = path.resolve(dir, item.name);
        if (item.isDirectory()) results = results.concat(walkDir(fullPath));
        else if (item.isFile() && item.name.endsWith(".ts") && item.name !== "CommandLoader.ts") results.push(fullPath);
      }
      return results;
    };

    const files = walkDir(commandsDir);

    for (const file of files) {
      try {
        const importedModule = await import(file);
        const exportedCommand: Command | undefined =
          importedModule?.default || Object.values(importedModule).find((exp) => (exp as Command)?.data);

        if (exportedCommand && exportedCommand.data) {
          CommandRegistry.register(exportedCommand);
          console.log(`✅ Command loaded: ${exportedCommand.data.name} (${file})`);
        } else {
          console.warn(`⚠️ No valid command found in ${file}`);
        }
      } catch (err) {
        console.error(`❌ Failed to load command from ${file}:`, err);
      }
    }

    console.log(`✅ Loaded ${CommandRegistry.count()} commands in total.`);
  }
}