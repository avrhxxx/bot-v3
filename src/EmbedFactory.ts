import { EmbedBuilder } from "discord.js";

export class EmbedFactory {

  // ================================
  // ALLIANCE CREATE / DELETE EMBED
  // ================================
  static buildAllianceOperation(
    title: string,
    roles: string[],
    structure: string[],
    finished = false,
    startedAt?: number,
    existingEmbed?: EmbedBuilder
  ): EmbedBuilder {
    const duration = startedAt
      ? `${Math.floor((Date.now() - startedAt) / 1000)}s`
      : "-";

    const embed = existingEmbed ?? new EmbedBuilder();
    embed.setTitle(title)
         .setColor(0x800080)
         .setDescription(
           `${roles.length
             ? "🛠 **Roles:**\n" + roles.join("\n") + "\n\n"
             : ""}` +
           `${structure.length
             ? "📂 **Channels:**\n" + structure.join("\n") + "\n\n"
             : ""}` +
           `${finished
             ? "🎉 Operation completed\n\n"
             : ""}` +
           `🕒 Duration: ${duration}`
         );
    return embed;
  }

  // ================================
  // BOT STATUS EMBED
  // ================================
  static buildBotStatus(
    isFrozen: boolean,
    existingEmbed?: EmbedBuilder
  ): EmbedBuilder {
    const embed = existingEmbed ?? new EmbedBuilder();
    embed.setTitle("🤖 Bot Status")
         .setColor(isFrozen ? 0xff0000 : 0x00ff00)
         .setDescription(isFrozen ? "🔒 Paused" : "🟢 Active");
    return embed;
  }

  // ================================
  // MAIN SYNC EMBED
  // ================================
  static buildSyncMain(
    lastChange: string,
    lastSync: string,
    existingEmbed?: EmbedBuilder
  ): EmbedBuilder {
    const embed = existingEmbed ?? new EmbedBuilder();
    embed.setTitle("📡 Synchronization")
         .setColor(0x800080)
         .setDescription(
           `Last change: ${lastChange || "No changes"}\n` +
           `🕒 Last sync: ${lastSync || "-"}`
         );
    return embed;
  }

  // ================================
  // CONTROL UNIT EMBED
  // ================================
  static buildControlUnit(
    authorityIds: string[],
    changes: string[],
    existingEmbed?: EmbedBuilder
  ): EmbedBuilder {
    const formattedAuthorities = authorityIds.length
      ? authorityIds.map(id => `<@${id}>`).join("\n")
      : "None";

    const formattedChanges = changes.length
      ? changes.join("\n")
      : "No changes";

    const embed = existingEmbed ?? new EmbedBuilder();
    embed.setTitle("🛡 Bot Control Unit")
         .setColor(0x800080)
         .setDescription(
           `👥 **Authorized:**\n${formattedAuthorities}\n\n` +
           `📜 **Recent changes:**\n${formattedChanges}`
         );
    return embed;
  }
}