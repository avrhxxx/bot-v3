// src/system/alliance/BroadcastModule/BroadcastModule.ts

import { AllianceService } from "../AllianceService";
import { ChannelModule } from "./ChannelModule";

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
    const alliance = AllianceService.getAllianceOrThrow(allianceId);
    const channelId = ChannelModule.getAnnounceChannel(allianceId);
    if (!channelId) return;

    this.emit("join", { allianceId, userId, channelId });
  }

  static async announceLeave(allianceId: string, userId: string) {
    const alliance = AllianceService.getAllianceOrThrow(allianceId);
    const channelId = ChannelModule.getAnnounceChannel(allianceId);
    if (!channelId) return;

    this.emit("leave", { allianceId, userId, channelId });
  }

  static async announceLeadershipChange(allianceId: string, oldLeaderId: string, newLeaderId: string) {
    const alliance = AllianceService.getAllianceOrThrow(allianceId);
    const channelId = ChannelModule.getAnnounceChannel(allianceId);
    if (!channelId) return;

    this.emit("leadershipChange", { allianceId, oldLeaderId, newLeaderId, channelId });
  }

  static async announceRollback(allianceId: string, message: string) {
    const alliance = AllianceService.getAllianceOrThrow(allianceId);
    const channelId = ChannelModule.getAnnounceChannel(allianceId);
    if (!channelId) return;

    this.emit("rollback", { allianceId, message, channelId });
  }

  static async sendCustomMessage(allianceId: string, message: string) {
    const alliance = AllianceService.getAllianceOrThrow(allianceId);
    const channelId = ChannelModule.getAnnounceChannel(allianceId);
    if (!channelId) return;

    this.emit("customMessage", { allianceId, message, channelId });
  }
}