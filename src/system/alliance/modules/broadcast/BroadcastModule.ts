/**
 * ============================================
 * FILE: src/system/alliance/modules/broadcast/BroadcastModule.ts
 * MODULE: BroadcastModule
 * LAYER: SYSTEM (Alliance Broadcast Module)
 * ============================================
 *
 * RESPONSIBILITY:
 * - Handle alliance events (join, leave, promotion, demotion, custom messages)
 * - Emit events for external modules (commands, services)
 * - Integrate with ChannelModule for announce, welcome, and staff-room channels
 *
 * DEPENDENCIES:
 * - AllianceService (fetch alliance data)
 * - ChannelModule (channels: announce, welcome, staff-room)
 * - RoleModule (optional for promotions/demotions)
 *
 * ============================================
 */

import { AllianceService } from "../../AllianceService";
import { ChannelModule } from "../channel/ChannelModule";
import { RoleModule } from "../role/RoleModule";

/**
 * Payload for broadcasting alliance events
 */
export interface BroadcastPayload {
  allianceId: string;
  userId?: string;
  actorId?: string;          // added for custom message
  oldLeaderId?: string;
  newLeaderId?: string;
  newRole?: string;
  message?: string;
  channelId: string;
  pingRoleIds?: string[];
  pingUserIds?: string[];
}

/**
 * BroadcastModule - emits events for alliance changes
 */
export class BroadcastModule {
  private static listeners: Record<string, ((...args: any[]) => void)[]> = {};

  // ----------------- EVENT MANAGEMENT -----------------
  static on(event: string, listener: (...args: any[]) => void) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(listener);
  }

  static emit(event: string, payload: BroadcastPayload) {
    const eventListeners = this.listeners[event] ?? [];
    for (const listener of eventListeners) {
      try {
        listener(payload);
      } catch (error) {
        console.error(`BroadcastModule: error in listener '${event}'`, error);
      }
    }
  }

  static off(event: string, listener?: (...args: any[]) => void) {
    if (!this.listeners[event]) return;
    if (!listener) delete this.listeners[event];
    else this.listeners[event] = this.listeners[event].filter(l => l !== listener);
  }

  static clearAll() {
    this.listeners = {};
  }

  // ----------------- ALLIANCE-SPECIFIC -----------------

  static async announceJoinRequest(
    allianceId: string,
    userId: string,
    pingRoleIds?: string[],
    pingUserIds?: string[]
  ) {
    const channelId = ChannelModule.getStaffChannel(allianceId);
    if (!channelId) return;
    this.emit("joinRequest", { allianceId, userId, channelId, pingRoleIds, pingUserIds });
  }

  static async announceJoin(
    allianceId: string,
    userId: string,
    pingRoleIds?: string[],
    pingUserIds?: string[]
  ) {
    const channelId = ChannelModule.getWelcomeChannel(allianceId);
    if (!channelId) return;
    this.emit("join", { allianceId, userId, channelId, pingRoleIds, pingUserIds });
  }

  // ----------------- LEAVE (moved to announce channel) -----------------
  static async announceLeave(
    allianceId: string,
    userId: string,
    pingRoleIds?: string[],
    pingUserIds?: string[]
  ) {
    const channelId = ChannelModule.getAnnounceChannel(allianceId); // changed
    if (!channelId) return;
    this.emit("leave", { allianceId, userId, channelId, pingRoleIds, pingUserIds });
  }

  static async announcePromotion(
    allianceId: string,
    userId: string,
    newRole: string,
    pingRoleIds?: string[],
    pingUserIds?: string[]
  ) {
    const channelId = ChannelModule.getAnnounceChannel(allianceId);
    if (!channelId) return;
    this.emit("promotion", { allianceId, userId, newRole, channelId, pingRoleIds, pingUserIds });
  }

  static async announceDemotion(
    allianceId: string,
    userId: string,
    newRole: string,
    pingRoleIds?: string[],
    pingUserIds?: string[]
  ) {
    const channelId = ChannelModule.getAnnounceChannel(allianceId);
    if (!channelId) return;
    this.emit("demotion", { allianceId, userId, newRole, channelId, pingRoleIds, pingUserIds });
  }

  // ----------------- CUSTOM MESSAGE (adds actorId prefix) -----------------
  static async sendCustomMessage(
    allianceId: string,
    message: string,
    actorId?: string,
    pingRoleIds?: string[],
    pingUserIds?: string[]
  ) {
    const channelId = ChannelModule.getAnnounceChannel(allianceId);
    if (!channelId) return;
    this.emit("customMessage", { allianceId, actorId, message, channelId, pingRoleIds, pingUserIds });
  }

  // ----------------- NEW ALLIANCE NOTIFICATIONS -----------------

  static async announceLeadershipChange(
    allianceId: string,
    oldLeaderId: string,
    newLeaderId: string,
    identityRoleId: string
  ) {
    const channelId = ChannelModule.getAnnounceChannel(allianceId);
    if (!channelId) return;
    this.emit("leadershipChange", {
      allianceId,
      oldLeaderId,
      newLeaderId,
      channelId,
      pingRoleIds: [identityRoleId],
    });
  }

  static async announceNameChange(
    allianceId: string,
    oldName: string,
    newName: string,
    identityRoleId: string
  ) {
    const channelId = ChannelModule.getAnnounceChannel(allianceId);
    if (!channelId) return;
    this.emit("nameChange", {
      allianceId,
      message: `📝 Alliance name changed from **${oldName}** to **${newName}**.`,
      channelId,
      pingRoleIds: [identityRoleId],
    });
  }

  static async announceTagChange(
    allianceId: string,
    oldTag: string,
    newTag: string,
    identityRoleId: string
  ) {
    const channelId = ChannelModule.getAnnounceChannel(allianceId);
    if (!channelId) return;
    this.emit("tagChange", {
      allianceId,
      message: `🏷️ Alliance tag changed from **${oldTag}** to **${newTag}**.`,
      channelId,
      pingRoleIds: [identityRoleId],
    });
  }

  static async announceAllianceRemoval(
    allianceId: string,
    identityRoleId: string
  ) {
    const channelId = ChannelModule.getAnnounceChannel(allianceId);
    if (!channelId) return;
    this.emit("allianceRemoval", {
      allianceId,
      message: `❌ The alliance has been removed.`,
      channelId,
      pingRoleIds: [identityRoleId],
    });
  }

  // ----------------- MESSAGE FORMAT -----------------
  static formatMessage(event: string, payload: BroadcastPayload): string {
    const pingRoles = payload.pingRoleIds?.map(r => `<@&${r}>`).join(' ') ?? '';
    const pingUsers = payload.pingUserIds?.map(u => `<@${u}>`).join(' ') ?? '';

    switch (event) {
      case "joinRequest":
        return `📝 User <@${payload.userId}> has requested to join the alliance.${pingRoles} ${pingUsers}`;
      case "join":
        return `🎉 User <@${payload.userId}> has joined the alliance!${pingRoles} ${pingUsers}`;
      case "leave":
        return `❌ User <@${payload.userId}> has left the alliance.${pingRoles} ${pingUsers}`;
      case "promotion":
        return `⬆️ User <@${payload.userId}> was promoted to ${payload.newRole}!${pingRoles} ${pingUsers}`;
      case "demotion":
        return `⬇️ User <@${payload.userId}> was demoted to ${payload.newRole}.${pingRoles} ${pingUsers}`;
      case "customMessage":
        return `📢 <@${payload.actorId}> says: ${payload.message}${pingRoles} ${pingUsers}`;
      case "leadershipChange":
        return `👑 Leadership Change: <@${payload.oldLeaderId}> → <@${payload.newLeaderId}> ${pingRoles}`;
      case "nameChange":
        return `${payload.message} ${pingRoles}`;
      case "tagChange":
        return `${payload.message} ${pingRoles}`;
      case "allianceRemoval":
        return `${payload.message} ${pingRoles}`;
      default:
        return `${event}: ${JSON.stringify(payload)}`;
    }
  }
}