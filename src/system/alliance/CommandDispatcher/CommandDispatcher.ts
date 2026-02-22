import { RoleModule } from "../RoleModule/RoleModule";
import { ChannelModule } from "../ChannelModule/ChannelModule";
import { BroadcastModule } from "../BroadcastModule/BroadcastModule";

/**
 * Typ komendy sojuszowej
 */
export interface AllianceCommand {
  name: string;
  params: Record<string, any>;
  actorId: string;
}

/**
 * CommandDispatcher: centralny wykonawca komend sojuszowych
 */
export class CommandDispatcher {
  /**
   * Mapowanie nazwy komendy na funkcję obsługującą
   */
  private static handlers: Record<string, (cmd: AllianceCommand) => Promise<void>> = {
    // role commands
    join: async (cmd) => RoleModule.addMember(cmd.actorId, cmd.params.allianceId, cmd.params.userId),
    leave: async (cmd) => RoleModule.removeMember(cmd.actorId, cmd.params.allianceId, cmd.params.userId),
    promote: async (cmd) => RoleModule.promoteMember(cmd.actorId, cmd.params.allianceId, cmd.params.userId),
    demote: async (cmd) => RoleModule.demoteMember(cmd.actorId, cmd.params.allianceId, cmd.params.userId),
    transferLeader: async (cmd) => RoleModule.transferLeader(cmd.actorId, cmd.params.allianceId, cmd.params.newLeaderId),

    // channel commands (np. do tworzenia lub aktualizacji kanałów)
    createChannels: async (cmd) => ChannelModule.createAllianceChannels(cmd.params.guild, cmd.params.tag, cmd.params.leaderId),
    updateChannels: async (cmd) => ChannelModule.updateChannels(cmd.params.allianceId, cmd.params.updates)
  };

  /**
   * Wykonuje komendę sojuszową
   */
  static async dispatch(command: AllianceCommand) {
    const handler = this.handlers[command.name];
    if (!handler) throw new Error(`Unknown alliance command: ${command.name}`);
    await handler(command);

    // Emituj zdarzenie do ewentualnych listenerów
    BroadcastModule.emit(command.name, command);
  }

  /**
   * Rejestruje nową komendę w dispatcherze
   */
  static registerCommand(name: string, handler: (cmd: AllianceCommand) => Promise<void>) {
    if (this.handlers[name]) throw new Error(`Command '${name}' already registered`);
    this.handlers[name] = handler;
  }
}