// File path: src/commands/loader/CommandLoader.ts
// fillpatch: CommandLoader responsible for dynamic loading of all commands 

import fs from "fs";
import path from "path";
import { Command } from "../Command";
import { CommandRegistry } from "../CommandRegistry";
// ✅ Jeśli w przyszłości pojawią się problemy z importami dynamicznymi w Node.js, 
// możemy użyć import { pathToFileURL } from "url"; i wtedy import(pathToFileURL(file).href)

/**
 * CommandLoader is responsible for dynamically discovering and loading
 * all command modules in the `commands` directory and its subdirectories.
 *
 * Advantages:
 * - Fully decoupled from CommandDispatcher.
 * - Handles both default and named exports for commands.
 * - Provides console logging for success and failure per file.
 */
export class CommandLoader {
  /**
   * Load all commands recursively from the commands directory and register them.
   *
   * Behavior:
   * - Skips CommandLoader.ts itself.
   * - Only considers `.ts` files.
   * - Registers commands into CommandRegistry automatically.
   * - Logs both successes and warnings/failures.
   */
  static async loadAllCommands(): Promise<void> {
    // Resolve base commands directory
    const commandsDir = path.resolve(__dirname, ".."); 

    // Recursive directory walker
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
        // ℹ️ Dynamic import using file path (works for both default and named exports)
        const importedModule = await import(file); 
        const exportedCommand: Command | undefined =
          importedModule?.default || Object.values(importedModule).find((exp) => (exp as Command)?.data);

        if (exportedCommand && exportedCommand.data) {
          CommandRegistry.register(exportedCommand);
          console.log(`✅ Command loaded: ${exportedCommand.data.name} (${file})`);
        } else {
          // ⚠️ File TS does not contain a valid command (missing `data`)
          console.warn(`⚠️ No valid command found in ${file}`);
        }
      } catch (err) {
        // ❌ Import or initialization failed
        console.error(`❌ Failed to load command from ${file}:`, err);
      }
    }

    console.log(`✅ Loaded ${CommandRegistry.count()} commands in total.`);
  }
}