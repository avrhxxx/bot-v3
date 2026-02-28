// src/sync/SyncNotify.ts
import { Guild, TextChannel, Message } from "discord.js";
import { EmbedFactory } from "./EmbedFactory";

export type NotifyEventType = "alliance" | "control" | "sync";

export interface NotifyEvent {
  id?: string;           // opcjonalne ID wiadomości (jeśli już istnieje)
  channelId: string;     // kanał docelowy
  type: NotifyEventType; // typ embeda
  payload: any;          // dane do przekazania do EmbedFactory
}

export class SyncNotify {
  private guild: Guild;
  private messages: Map<string, NotifyEvent> = new Map();

  constructor(guild: Guild) {
    this.guild = guild;
  }

  /**
   * Raport od unitów lub serwisów
   */
  public async report(event: NotifyEvent) {
    const channel = this.guild.channels.cache.get(event.channelId) as TextChannel;
    if (!channel) {
      console.warn(`[SyncNotify] Channel ${event.channelId} not found`);
      return;
    }

    // --- tworzenie embeda w zależności od typu ---
    let embed;
    switch (event.type) {
      case "alliance":
        embed = EmbedFactory.buildAllianceOperation(
          event.payload.title,
          event.payload.roles || [],
          event.payload.structure || [],
          event.payload.finished,
          event.payload.startedAt
        );
        break;

      case "control":
        embed = EmbedFactory.buildControlUnit(
          event.payload.authorityIds || [],
          event.payload.changes || []
        );
        break;

      case "sync":
        embed = EmbedFactory.buildSyncMain(
          event.payload.lastChange || "",
          event.payload.lastSync || ""
        );
        break;

      default:
        console.warn(`[SyncNotify] Unknown event type: ${event.type}`);
        return;
    }

    // --- wysyłka lub edycja wiadomości ---
    if (!event.id) {
      // nowa wiadomość
      const msg: Message = await channel.send({ embeds: [embed] });
      event.id = msg.id;
      this.messages.set(msg.id, event);
    } else {
      // edycja istniejącej wiadomości
      const msg: Message = await channel.messages.fetch(event.id).catch(() => null);
      if (msg) {
        await msg.edit({ embeds: [embed] });
      } else {
        // jeśli wiadomość została usunięta, utwórz nową
        const newMsg = await channel.send({ embeds: [embed] });
        event.id = newMsg.id;
        this.messages.set(newMsg.id, event);
      }
    }
  }

  /**
   * Opcjonalna metoda do masowego raportowania
   */
  public async reportBatch(events: NotifyEvent[]) {
    for (const e of events) {
      await this.report(e);
    }
  }

  /**
   * Pobranie aktualnego stanu wszystkich raportów (przydatne np. do testów)
   */
  public getAllReports(): NotifyEvent[] {
    return Array.from(this.messages.values());
  }
}
