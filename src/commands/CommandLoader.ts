// src/commands/CommandLoader.ts

import fs from "fs";
import path from "path";
import { Command } from "./Command";
import { CommandRegistry } from "./CommandRegistry";

export class CommandLoader {
  /**
   * Recursively load all commands from the given directory
   */
  private static async loadCommandsFromDir(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.resolve(dir, entry.name);

      if (entry.isDirectory()) {
        await this.loadCommandsFromDir(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".js"))) {
        try {
          const module = await import(fullPath);
          // Find exported command
          const exportedCommand = Object.values(module).find(
            (exp) => exp && (exp as Command).data
          ) as Command | undefined;

          if (exportedCommand) {
            CommandRegistry.register(exportedCommand);
            console.log(`✅ Command loaded: ${exportedCommand.data.name}`);
          } else {
            console.warn(`⚠️ No valid command found in ${fullPath}`);
          }
        } catch (err) {
          console.error(`❌ Failed to load command from ${fullPath}:`, err);
        }
      }
    }
  }

  /**
   * Load all commands from sys/ and alliance/ folders
   */
  public static async loadAllCommands() {
    const baseDir = path.join(__dirname);
    const namespaces = ["sys", "alliance"];

    for (const ns of namespaces) {
      const dir = path.join(baseDir, ns);
      if (fs.existsSync(dir)) {
        await this.loadCommandsFromDir(dir);
      } else {
        console.warn(`⚠️ Commands namespace folder missing: ${dir}`);
      }
    }
  }
}