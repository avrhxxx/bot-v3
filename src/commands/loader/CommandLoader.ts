// File path: src/commands/loader/CommandLoader.ts
import fs from "fs";
import path from "path";
import { Command } from "../Command";
import { CommandRegistry } from "../CommandRegistry";
// ✅ Jeśli w przyszłości pojawią się problemy z importami dynamicznymi w Node.js, 
// możemy użyć import { pathToFileURL } from "url"; i wtedy import(pathToFileURL(file).href)

/**
 * fillpatch: CommandLoader responsible for dynamic loading of all commands 
 * (now independent of CommandDispatcher)
 */
export class CommandLoader {
  /**
   * Load all command modules dynamically and register them into CommandRegistry.
   * This replaces the old CommandDispatcher registration system.
   *
   * Notes:
   * - Supports both `export default Command` and `export const Command`.
   * - Logs the file path and command name for debugging.
   * - Skips non-.ts files and CommandLoader.ts itself.
   */
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
        // ℹ️ Dynamic import using file path (works for both default and named exports)
        const importedModule = await import(file); 
        const exportedCommand: Command | undefined =
          importedModule?.default || Object.values(importedModule).find((exp) => (exp as Command)?.data);

        if (exportedCommand && exportedCommand.data) {
          CommandRegistry.register(exportedCommand);
          console.log(`✅ Command loaded: ${exportedCommand.data.name} (${file})`);
        } else {
          // ⚠️ Plik TS nie zawiera prawidłowej komendy (brak `data`)
          console.warn(`⚠️ No valid command found in ${file}`);
        }
      } catch (err) {
        // ❌ Import lub inicjalizacja modułu nie powiodła się
        console.error(`❌ Failed to load command from ${file}:`, err);
      }
    }

    console.log(`✅ Loaded ${CommandRegistry.count()} commands in total.`);
  }
}