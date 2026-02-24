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

export class BroadcastModule {
  private static listeners: Record<string, Listener[]> = {};

  // ----------------- GENERIC EVENTS -----------------
  static on(event: string, listener: Listener) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(listener);
  }

  static emit(event: string, ...args: any[]) {
    const eventListeners = this.listeners[event] ?? [];
    for (const listener of eventListeners) {
      try {
        listener(...args);
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

  /**
   * Powiadomienie o nowym wniosku dołączenia
   * Emituje event 'joinRequest' do staff-room (R5/R4)
   */
  static async announceJoinRequest(allianceId: string, userId: string) {
    const channelId = ChannelModule.getStaffChannel(allianceId);
    if (!channelId) return;

    this.emit("joinRequest", { allianceId, userId, channelId });
  }

  /**
   * Powiadomienie o zaakceptowaniu nowego członka
   * Wysyła event 'join' do welcome channel
   */
  static async announceJoin(allianceId: string, userId: string) {
    const channelId = ChannelModule.getWelcomeChannel(allianceId);
    if (!channelId) return;

    this.emit("join", { allianceId, userId, channelId });
  }

  /**
   * Powiadomienie o opuszczeniu sojuszu
   * Wysyła event 'leave' do announce channel
   */
  static async announceLeave(allianceId: string, userId: string) {
    const channelId = ChannelModule.getAnnounceChannel(allianceId);
    if (!channelId) return;

    this.emit("leave", { allianceId, userId, channelId });
  }

  /**
   * Zmiana lidera
   * Wysyła event 'leadershipChange' do announce channel
   */
  static async announceLeadershipChange(allianceId: string, oldLeaderId: string, newLeaderId: string) {
    const channelId = ChannelModule.getAnnounceChannel(allianceId);
    if (!channelId) return;

    this.emit("leadershipChange", { allianceId, oldLeaderId, newLeaderId, channelId });
  }

  /**
   * Rollback operacji
   * Wysyła event 'rollback' do announce channel
   */
  static async announceRollback(allianceId: string, message: string) {
    const channelId = ChannelModule.getAnnounceChannel(allianceId);
    if (!channelId) return;

    this.emit("rollback", { allianceId, message, channelId });
  }

  /**
   * Wysyłanie niestandardowych wiadomości do announce channel
   */
  static async sendCustomMessage(allianceId: string, message: string) {
    const channelId = ChannelModule.getAnnounceChannel(allianceId);
    if (!channelId) return;

    this.emit("customMessage", { allianceId, message, channelId });
  }
}