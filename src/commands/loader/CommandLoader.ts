// src/commands/loader/CommandLoader.ts
import { CommandRegistry, Command } from '../CommandRegistry';

export class CommandLoader {
  static async loadAllCommands(): Promise<void> {
    const commands: Command[] = await Promise.resolve([
      { name: 'ping', execute: () => console.log('pong') },
      { name: 'echo', execute: () => console.log('echo') },
    ]);

    CommandRegistry.register(commands);

    CommandRegistry.getAll().forEach((cmd: Command) => {
      console.log(`Command loaded: ${cmd.name}`);
    });
  }
}