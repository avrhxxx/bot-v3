/**
 * src/commands/loader/CommandRegistry.ts
 */
export type Command = {
  name: string;
  execute(): void;
};

export class CommandRegistry {
  private static commands: Command[] = [];

  static register(cmds: Command[]) {
    this.commands.push(...cmds);
  }

  static getAll(): Command[] {
    return this.commands;
  }
}