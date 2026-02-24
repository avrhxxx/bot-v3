/**
 * ============================================
 * FILE: src/system/alliance/modules/broadcast/BroadcastModule.ts
 * LAYER: SYSTEM (Alliance Broadcast Module)
 * ============================================
 *
 * ODPOWIEDZIALNOŚĆ:
 * - Obsługa zdarzeń sojuszu (join, leave, promocje, democje, custom messages)
 * - Emitowanie eventów dla modułów zewnętrznych
 * - Integracja z ChannelModule dla kanałów announce
 *
 * ZALEŻNOŚCI:
 * - AllianceService (pobranie sojuszu)
 * - ChannelModule (kanały announce)
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
  static async announceJoin(allianceId: string, userId: string) {
    const channelId = ChannelModule.getAnnounceChannel(allianceId);
    if (!channelId) return;

    this.emit("join", { allianceId, userId, channelId });
  }

  static async announceLeave(allianceId: string, userId: string) {
    const channelId = ChannelModule.getAnnounceChannel(allianceId);
    if (!channelId) return;

    this.emit("leave", { allianceId, userId, channelId });
  }

  static async announceLeadershipChange(allianceId: string, oldLeaderId: string, newLeaderId: string) {
    const channelId = ChannelModule.getAnnounceChannel(allianceId);
    if (!channelId) return;

    this.emit("leadershipChange", { allianceId, oldLeaderId, newLeaderId, channelId });
  }

  static async announceRollback(allianceId: string, message: string) {
    const channelId = ChannelModule.getAnnounceChannel(allianceId);
    if (!channelId) return;

    this.emit("rollback", { allianceId, message, channelId });
  }

  static async sendCustomMessage(allianceId: string, message: string) {
    const channelId = ChannelModule.getAnnounceChannel(allianceId);
    if (!channelId) return;

    this.emit("customMessage", { allianceId, message, channelId });
  }
}