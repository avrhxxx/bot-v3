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

  /**
   * Join request:
   * - Goes to staff-room
   * - Only R4/R5 see it
   * - Triggered by system when user uses join command
   */
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

  /**
   * Join accepted:
   * - Goes to welcome channel
   * - All alliance members see it
   * - Only bot sends this message
   */
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

  /**
   * Leave:
   * - Goes to welcome channel
   * - All alliance members see it
   * - Only bot sends this message
   */
  static async announceLeave(
    allianceId: string,
    userId: string,
    pingRoleIds?: string[],
    pingUserIds?: string[]
  ) {
    const channelId = ChannelModule.getWelcomeChannel(allianceId);
    if (!channelId) return;
    this.emit("leave", { allianceId, userId, channelId, pingRoleIds, pingUserIds });
  }

  /**
   * Promotion:
   * - Goes to announce channel
   * - All alliance members see it
   * - Only bot sends this message
   */
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

  /**
   * Demotion:
   * - Goes to announce channel
   * - All alliance members see it
   * - Only bot sends this message
   */
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

  /**
   * Custom message:
   * - Goes to announce channel
   * - All alliance members see it
   * - Sent by R4/R5 via broadcast command
   */
  static async sendCustomMessage(
    allianceId: string,
    message: string,
    pingRoleIds?: string[],
    pingUserIds?: string[]
  ) {
    const channelId = ChannelModule.getAnnounceChannel(allianceId);
    if (!channelId) return;
    this.emit("customMessage", { allianceId, message, channelId, pingRoleIds, pingUserIds });
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
        return `${payload.message}${pingRoles} ${pingUsers}`;
      default:
        return `${event}: ${JSON.stringify(payload)}`;
    }
  }
}