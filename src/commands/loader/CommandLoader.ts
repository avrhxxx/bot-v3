import { CommandRegistry, Command } from '../CommandRegistry';

export class CommandLoader {
  static async loadAllCommands(): Promise<void> {
    const commands: Command[] = [
      { name: 'ping', execute: () => console.log('pong') },
      { name: 'echo', execute: () => console.log('echo') },
    ];

    CommandRegistry.register(commands);

    CommandRegistry.getAll().forEach(cmd => {
      console.log(`Command loaded: ${cmd.name}`);
    });
  }
}