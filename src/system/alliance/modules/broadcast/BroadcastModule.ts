/**
 * ============================================
 * FILE: src/system/alliance/modules/broadcast/BroadcastModule.ts
 * LAYER: SYSTEM (Alliance Broadcast Module)
 * ============================================
 *
 * ODPOWIEDZIALNOŚĆ:
 * - Obsługa zdarzeń sojuszu (join, leave, promocje, democje, custom messages)
 * - Emitowanie eventów dla modułów zewnętrznych
 * - Integracja z ChannelModule dla kanałów announce, welcome i staff-room
 * - Wysyłanie powiadomień do staff-room przy wniosku o dołączenie
 * - Powiadomienia do welcome channel przy zaakceptowaniu członka
 * - Obsługa opcjonalnych pingów ról/użytkowników w wiadomościach
 *
 * ZALEŻNOŚCI:
 * - AllianceService (pobranie sojuszu)
 * - ChannelModule (kanały announce, welcome, staff-room)
 *
 * UWAGA:
 * - Emituje zdarzenia w postaci listenerów
 * - Nie modyfikuje bezpośrednio ról ani kanałów
 *
 * ============================================
 */

import { AllianceService } from "../../AllianceService";
import { ChannelModule } from "../ChannelModule/ChannelModule";

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

  // ----------------- GENERIC EVENTS -----------------
  static on(event: string, listener: Listener) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(listener);
  }

  static emit(event: string, payload: BroadcastPayload) {
    const eventListeners = this.listeners[event] ?? [];
    for (const listener of eventListeners) {
      try {
        listener(payload);
      } catch (error) {
        console.error(`BroadcastModule: error in listener for event '${event}'`, error);
      }
    }
  }

  static off(event: string, listener?: Listener) {
    if (!this.listeners[event]) return;
    if (!listener) delete this.listeners[event];
    else this.listeners[event] = this.listeners[event].filter(l => l !== listener);
  }

  static clearAll() {
    this.listeners = {};
  }

  // ----------------- ALLIANCE-SPECIFIC METHODS -----------------

  // --- Join Request (staff-room) ---
  static async announceJoinRequest(allianceId: string, userId: string, pingRoleIds?: string[], pingUserIds?: string[]) {
    const channelId = ChannelModule.getStaffChannel(allianceId);
    if (!channelId) return;

    this.emit("joinRequest", { allianceId, userId, channelId, pingRoleIds, pingUserIds });
  }

  // --- Join (welcome channel) ---
  static async announceJoin(allianceId: string, userId: string, pingRoleIds?: string[], pingUserIds?: string[]) {
    const channelId = ChannelModule.getWelcomeChannel(allianceId);
    if (!channelId) return;

    this.emit("join", { allianceId, userId, channelId, pingRoleIds, pingUserIds });
  }

  // --- Leave (announce channel) ---
  static async announceLeave(allianceId: string, userId: string, pingRoleIds?: string[], pingUserIds?: string[]) {
    const channelId = ChannelModule.getAnnounceChannel(allianceId);
    if (!channelId) return;

    this.emit("leave", { allianceId, userId, channelId, pingRoleIds, pingUserIds });
  }

  // --- Leadership Change (announce channel) ---
  static async announceLeadershipChange(allianceId: string, oldLeaderId: string, newLeaderId: string, pingRoleIds?: string[], pingUserIds?: string[]) {
    const channelId = ChannelModule.getAnnounceChannel(allianceId);
    if (!channelId) return;

    this.emit("leadershipChange", { allianceId, oldLeaderId, newLeaderId, channelId, pingRoleIds, pingUserIds });
  }

  // --- Rollback (announce channel) ---
  static async announceRollback(allianceId: string, message: string, pingRoleIds?: string[], pingUserIds?: string[]) {
    const channelId = ChannelModule.getAnnounceChannel(allianceId);
    if (!channelId) return;

    this.emit("rollback", { allianceId, message, channelId, pingRoleIds, pingUserIds });
  }

  // --- Custom Message (announce channel) ---
  static async sendCustomMessage(allianceId: string, message: string, pingRoleIds?: string[], pingUserIds?: string[]) {
    const channelId = ChannelModule.getAnnounceChannel(allianceId);
    if (!channelId) return;

    this.emit("customMessage", { allianceId, message, channelId, pingRoleIds, pingUserIds });
  }

  // --- Promotion (announce channel) ---
  static async announcePromotion(allianceId: string, userId: string, newRole: string, pingRoleIds?: string[], pingUserIds?: string[]) {
    const channelId = ChannelModule.getAnnounceChannel(allianceId);
    if (!channelId) return;

    this.emit("promotion", { allianceId, userId, newRole, channelId, pingRoleIds, pingUserIds });
  }

  // --- Demotion (announce channel) ---
  static async announceDemotion(allianceId: string, userId: string, newRole: string, pingRoleIds?: string[], pingUserIds?: string[]) {
    const channelId = ChannelModule.getAnnounceChannel(allianceId);
    if (!channelId) return;

    this.emit("demotion", { allianceId, userId, newRole, channelId, pingRoleIds, pingUserIds });
  }

  // ----------------- HELPERS: FORMAT MESSAGE -----------------
  static formatMessage(event: string, payload: BroadcastPayload): string {
    switch(event) {
      case "joinRequest":
        return `📝 Użytkownik <@${payload.userId}> zgłosił chęć dołączenia do sojuszu.${payload.pingRoleIds ? ` ${payload.pingRoleIds.map(r => `<@&${r}>`).join(' ')}` : ''}${payload.pingUserIds ? ` ${payload.pingUserIds.map(u => `<@${u}>`).join(' ')}` : ''}`;
      case "join":
        return `🎉 <@${payload.userId}> dołączył do sojuszu! Powitajmy nowego członka!${payload.pingRoleIds ? ` ${payload.pingRoleIds.map(r => `<@&${r}>`).join(' ')}` : ''}${payload.pingUserIds ? ` ${payload.pingUserIds.map(u => `<@${u}>`).join(' ')}` : ''}`;
      case "leave":
        return `❌ <@${payload.userId}> opuścił sojusz.${payload.pingRoleIds ? ` ${payload.pingRoleIds.map(r => `<@&${r}>`).join(' ')}` : ''}${payload.pingUserIds ? ` ${payload.pingUserIds.map(u => `<@${u}>`).join(' ')}` : ''}`;
      case "leadershipChange":
        return `👑 Lider sojuszu zmienił się z <@${payload.oldLeaderId}> na <@${payload.newLeaderId}>.${payload.pingRoleIds ? ` ${payload.pingRoleIds.map(r => `<@&${r}>`).join(' ')}` : ''}${payload.pingUserIds ? ` ${payload.pingUserIds.map(u => `<@${u}>`).join(' ')}` : ''}`;
      case "rollback":
        return `⚠️ Rollback operacji w sojuszu: ${payload.message}${payload.pingRoleIds ? ` ${payload.pingRoleIds.map(r => `<@&${r}>`).join(' ')}` : ''}${payload.pingUserIds ? ` ${payload.pingUserIds.map(u => `<@${u}>`).join(' ')}` : ''}`;
      case "customMessage":
        return `${payload.message}${payload.pingRoleIds ? ` ${payload.pingRoleIds.map(r => `<@&${r}>`).join(' ')}` : ''}${payload.pingUserIds ? ` ${payload.pingUserIds.map(u => `<@${u}>`).join(' ')}` : ''}`;
      case "promotion":
        return `⬆️ Użytkownik <@${payload.userId}> został awansowany do rangi ${payload.newRole}!${payload.pingRoleIds ? ` ${payload.pingRoleIds.map(r => `<@&${r}>`).join(' ')}` : ''}${payload.pingUserIds ? ` ${payload.pingUserIds.map(u => `<@${u}>`).join(' ')}` : ''}`;
      case "demotion":
        return `⬇️ Użytkownik <@${payload.userId}> został zdegradowany do rangi ${payload.newRole}.${payload.pingRoleIds ? ` ${payload.pingRoleIds.map(r => `<@&${r}>`).join(' ')}` : ''}${payload.pingUserIds ? ` ${payload.pingUserIds.map(u => `<@${u}>`).join(' ')}` : ''}`;
      default:
        return `${event}: ${JSON.stringify(payload)}`;
    }
  