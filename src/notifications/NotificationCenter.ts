// src/notifications/NotificationCenter.ts
import { Guild } from "discord.js";
import { EmbedFactory } from "../EmbedFactory"; // teraz importujemy luźny plik w src

type NotificationPayload = {
  type: "alliance" | "botControl" | "syncUnit" | "eventUnit";
  guild: Guild;
  title?: string;
  details?: string[];
  roles?: string[];
  channels?: string[];
  finished?: boolean;
  startedAt?: number;
  authorityIds?: string[];
  changes?: string[];
};

export class NotificationCenter {
  private static instance: NotificationCenter;
  private queue: NotificationPayload[] = [];
  private processing = false;

  private constructor() {}

  public static getInstance(): NotificationCenter {
    if (!NotificationCenter.instance) {
      NotificationCenter.instance = new NotificationCenter();
    }
    return NotificationCenter.instance;
  }

  /**
   * Add a new notification to the queue
   */
  public notify(payload: NotificationPayload) {
    this.queue.push(payload);
    this.processQueue();
  }

  /**
   * Process queued notifications sequentially
   */
  private async processQueue() {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift();
      if (!item) continue;

      try {
        await this.handleNotification(item);
      } catch (err) {
        console.error("[NotificationCenter] Error handling notification:", err);
      }
    }

    this.processing = false;
  }

  /**
   * Handle a single notification and delegate to EmbedFactory
   */
  private async handleNotification(item: NotificationPayload) {
    const { type, guild } = item;

    switch (type) {
      case "alliance":
        if (!item.title || !item.roles || !item.channels) return;
        const allianceEmbed = EmbedFactory.buildAllianceOperation(
          item.title,
          item.roles,
          item.channels,
          item.finished,
          item.startedAt
        );
        await this.sendOrUpdateMessage(guild, "alliance-log", allianceEmbed);
        break;

      case "botControl":
        if (!item.authorityIds || !item.changes) return;
        const controlEmbed = EmbedFactory.buildControlUnit(item.authorityIds, item.changes);
        await this.sendOrUpdateMessage(guild, "bot-control-log", controlEmbed);
        break;

      case "syncUnit":
      case "eventUnit":
        if (!item.title || !item.details) return;
        const unitEmbed = EmbedFactory.buildSyncMain(
          item.details.join("\n"),
          new Date().toISOString()
        );
        await this.sendOrUpdateMessage(guild, "sync-log", unitEmbed);
        break;

      default:
        console.warn("[NotificationCenter] Unknown notification type:", type);
    }
  }

  /**
   * Send a new message or update the existing one in the dedicated channel
   */
  private async sendOrUpdateMessage(guild: Guild, channelName: string, embed: any) {
    // Find or create channel
    let channel = guild.channels.cache.find(c => c.name === channelName && c.isTextBased());
    if (!channel) {
      channel = await guild.channels.create({
        name: channelName,
        type: 0, // GuildText
        permissionOverwrites: [
          { id: guild.roles.everyone.id, deny: ["ViewChannel"] }
        ]
      });
    }

    // Check if message exists (only one message per channel)
    const messages = await channel.messages.fetch({ limit: 1 });
    if (messages.size === 0) {
      await channel.send({ embeds: [embed] });
    } else {
      const msg = messages.first();
      await msg?.edit({ embeds: [embed] });
    }
  }
}