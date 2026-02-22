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
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await this.loadCommandsFromDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".ts")) {
        const module = await import(fullPath);
        const command: Command = module[Object.keys(module)[0]]; // assumes export const <CommandName>
        if (command && command.data) {
          CommandRegistry.register(command);
          console.log(`✅ Command loaded: ${command.data.name}`);
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
      }
    }
  }
}