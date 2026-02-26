/**
 * Loader wszystkich komend do bota
 */
import { CommandRegistry, Command } from "./CommandRegistry"; // Twój obecny CommandRegistry

export class CommandLoader {
  static async loadAllCommands(): Promise<void> {
    // Przykładowa tablica komend
    const commands: Command[] = await Promise.resolve([
      { name: "ping", execute: () => console.log("pong") },
      { name: "echo", execute: () => console.log("echo") }
    ]);

    // Statyczna rejestracja w CommandRegistry
    CommandRegistry.register(commands);

    // Wypisanie wszystkich komend
    CommandRegistry.getAll().forEach((cmd: Command) => {
      console.log(`Command loaded: ${cmd.name}`);
    });
  }
}