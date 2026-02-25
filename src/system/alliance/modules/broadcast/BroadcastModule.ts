/**
 * ============================================
 * MODULE: BroadcastModule
 * FILE: src/system/alliance/modules/broadcast/BroadcastModule.ts
 * LAYER: SYSTEM (Alliance Broadcast Module)
 * ============================================
 *
 * RESPONSIBILITY:
 * - Handle alliance events (join, leave, promotion, demotion, custom messages)
 * - Emit events for external modules
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

type Listener = (...args: any[]) => void;

interface BroadcastPayload {
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

export class BroadcastModule {
  private static listeners: Record<string, Listener[]> = {};

  static on(event: string, listener: Listener) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(listener);
  }

  static emit(event: string, payload: BroadcastPayload) {
    const eventListeners = this.listeners[event] ?? [];
    for (const listener of eventListeners) {
      try { listener(payload); } 
      catch (error) { console.error(`BroadcastModule: error in listener '${event}'`, error); }
    }
  }

  static off(event: string, listener?: Listener) {
    if (!this.listeners[event]) return;
    if (!listener) delete this.listeners[event];
    else this.listeners[event] = this.listeners[event].filter(l => l !== listener);
  }

  static clearAll() { this.listeners = {}; }

  // ----------------- ALLIANCE-SPECIFIC -----------------
  static async announceJoinRequest(allianceId: string, userId: string, pingRoleIds?: string[], pingUserIds?: string[]) {
    const channelId = ChannelModule.getStaffChannel(allianceId);
    if (!channelId) return;
    this.emit("joinRequest", { allianceId, userId, channelId, pingRoleIds, pingUserIds });
  }

  static async announceJoin(allianceId: string, userId: string, pingRoleIds?: string[], pingUserIds?: string[]) {
    const channelId = ChannelModule.getWelcomeChannel(allianceId);
    if (!channelId) return;
    this.emit("join", { allianceId, userId, channelId, pingRoleIds, pingUserIds });
  }

  static async announceLeave(allianceId: string, userId: string, pingRoleIds?: string[], pingUserIds?: string[]) {
    const channelId = ChannelModule.getAnnounceChannel(allianceId);
    if (!channelId) return;
    this.emit("leave", { allianceId, userId, channelId, pingRoleIds, pingUserIds });
  }

  static async announcePromotion(allianceId: string, userId: string, newRole: string, pingRoleIds?: string[], pingUserIds?: string[]) {
    const channelId = ChannelModule.getAnnounceChannel(allianceId);
    if (!channelId) return;
    this.emit("promotion", { allianceId, userId, newRole, channelId, pingRoleIds, pingUserIds });
  }

  static async announceDemotion(allianceId: string, userId: string, newRole: string, pingRoleIds?: string[], pingUserIds?: string[]) {
    const channelId = ChannelModule.getAnnounceChannel(allianceId);
    if (!channelId) return;
    this.emit("demotion", { allianceId, userId, newRole, channelId, pingRoleIds, pingUserIds });
  }

  static async sendCustomMessage(allianceId: string, message: string, pingRoleIds?: string[], pingUserIds?: string[]) {
    const channelId = ChannelModule.getAnnounceChannel(allianceId);
    if (!channelId) return;
    this.emit("customMessage", { allianceId, message, channelId, pingRoleIds, pingUserIds });
  }

  static formatMessage(event: string, payload: BroadcastPayload): string {
    switch(event) {
      case "joinRequest": return `📝 User <@${payload.userId}> requested to join the alliance.${payload.pingRoleIds ? ` ${payload.pingRoleIds.map(r => `<@&${r}>`).join(' ')}` : ''}${payload.pingUserIds ? ` ${payload.pingUserIds.map(u => `<@${u}>`).join(' ')}` : ''}`;
      case "join": return `🎉 <@${payload.userId}> joined the alliance!${payload.pingRoleIds ? ` ${payload.pingRoleIds.map(r => `<@&${r}>`).join(' ')}` : ''}${payload.pingUserIds ? ` ${payload.pingUserIds.map(u => `<@${u}>`).join(' ')}` : ''}`;
      case "leave": return `❌ <@${payload.userId}> left the alliance.${payload.pingRoleIds ? ` ${payload.pingRoleIds.map(r => `<@&${r}>`).join(' ')}` : ''}${payload.pingUserIds ? ` ${payload.pingUserIds.map(u => `<@${u}>`).join(' ')}` : ''}`;
      case "promotion": return `⬆️ User <@${payload.userId}> was promoted to ${payload.newRole}!${payload.pingRoleIds ? ` ${payload.pingRoleIds.map(r => `<@&${r}>`).join(' ')}` : ''}${payload.pingUserIds ? ` ${payload.pingUserIds.map(u => `<@${u}>`).join(' ')}` : ''}`;
      case "demotion": return `⬇️ User <@${payload.userId}> was demoted to ${payload.newRole}.${payload.pingRoleIds ? ` ${payload.pingRoleIds.map(r => `<@&${r}>`).join(' ')}` : ''}${payload.pingUserIds ? ` ${payload.pingUserIds.map(u => `<@${u}>`).join(' ')}` : ''}`;
      case "customMessage": return `${payload.message}${payload.pingRoleIds ? ` ${payload.pingRoleIds.map(r => `<@&${r}>`).join(' ')}` : ''}${payload.pingUserIds ? ` ${payload.pingUserIds.map(u => `<@${u}>`).join(' ')}` : ''}`;
      default: return `${event}: ${JSON.stringify(payload)}`;
    }
  }
}