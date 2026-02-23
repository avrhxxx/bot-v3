// src/system/alliance/CommandDispatcher/CommandDispatcher.ts

import { MembershipModule } from "../MembershipModule";
import { RoleModule } from "../RoleModule/RoleModule";
import { ChannelModule } from "../ChannelModule/ChannelModule";
import { BroadcastModule } from "../BroadcastModule/BroadcastModule";
import { AllianceService } from "../AllianceService";

export interface AllianceCommand {
  name: string;
  params: Record<string, any>;
  actorId: string;
}

export class CommandDispatcher {
  private static handlers: Record<string, (cmd: AllianceCommand) => Promise<void>> = {
    // MEMBERSHIP
    join: async (cmd) => MembershipModule.requestJoin(cmd.actorId, cmd.params.allianceId),
    approveJoin: async (cmd) => MembershipModule.approveJoin(cmd.actorId, cmd.params.allianceId, cmd.params.userId),
    denyJoin: async (cmd) => MembershipModule.denyJoin(cmd.actorId, cmd.params.allianceId, cmd.params.userId),
    leave: async (cmd) => MembershipModule.leaveAlliance(cmd.actorId, cmd.params.allianceId),

    // ROLE
    promote: async (cmd) => RoleModule.promote(cmd.params.userId, cmd.params.allianceId),
    demote: async (cmd) => RoleModule.demote(cmd.params.userId, cmd.params.allianceId),
    assignRole: async (cmd) => RoleModule.assignRole(cmd.params.userId, cmd.params.allianceId, cmd.params.role),

    // LEADERSHIP
    transferLeader: async (cmd) => AllianceService.transferLeadership(cmd.actorId, cmd.params.allianceId, cmd.params.newLeaderId),

    // CHANNELS
    createChannels: async (cmd) => ChannelModule.createChannels(cmd.params.guild, cmd.params.allianceId, cmd.params.tag),
    updateChannels: async (cmd) => ChannelModule.updateChannelVisibility(cmd.params.allianceId),
  };

  static async dispatch(command: AllianceCommand) {
    // WALIDACJA UPRAWNIEŃ
    await CommandDispatcher.validatePermissions(command.actorId, command.name);

    const handler = this.handlers[command.name];
    if (!handler) throw new Error(`Unknown alliance command: ${command.name}`);
    await handler(command);

    // Emituj zdarzenie
    BroadcastModule.emit(command.name, command);
  }

  static registerCommand(name: string, handler: (cmd: AllianceCommand) => Promise<void>) {
    if (this.handlers[name]) throw new Error(`Command '${name}' already registered`);
    this.handlers[name] = handler;
  }

  private static async validatePermissions(actorId: string, action: string) {
    // przykład: sprawdzenie uprawnień w AllianceService
    if (!AllianceService.hasPermission(actorId, action)) {
      throw new Error(`Actor ${actorId} does not have permission for ${action}`);
    }
  }
}