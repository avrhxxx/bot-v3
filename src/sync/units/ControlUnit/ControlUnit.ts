// src/sync/units/ControlUnit/ControlUnit.ts
import { Guild } from "discord.js";
import { BotControlService } from "../../../botControl/BotControlService";
import { EmbedBuilder } from "../../../EmbedBuilder";

export class ControlUnit {
  private botControlService: BotControlService;

  constructor() {
    this.botControlService = new BotControlService();
  }

  /**
   * Synchronizacja stanu Bot Control
   * - sprawdza, kto ma rolę
   * - usuwa/aktualizuje role w Discordzie
   * - aktualizuje embed statusu
   */
  public async synchronize(guild: Guild) {
    const authorityIds = this.getAuthorityIdsFromDB();

    // 1️⃣ Aktualizacja członków
    await this.botControlService.updateMembers(guild, authorityIds);

    // 2️⃣ Aktualizacja embedów
    const changes = this.generateChanges(authorityIds, guild);

    await EmbedBuilder.updateControlUnitEmbed(guild, authorityIds, changes);
  }

  /**
   * Pobiera listę userów z uprawnieniami z DB
   */
  private getAuthorityIdsFromDB(): string[] {
    // Tu możesz pobrać z BotControlDB.authorityIds
    const { BotControlDB } = require("../../../db/BotControlDB");
    return BotControlDB.authorityIds || [];
  }

  /**
   * Generuje listę zmian (dodatki / usunięcia)
   */
  private generateChanges(authorityIds: string[], guild: Guild): string[] {
    const members = guild.members.cache;
    const changes: string[] = [];

    // Sprawdzenie brakujących i nadmiarowych ról
    members.forEach(member => {
      const hasRole = member.roles.cache.has(require("../../../db/BotControlDB").BotControlDB.roleId);
      if (authorityIds.includes(member.id) && !hasRole) {
        changes.push(`➕ ${member.user.tag}`);
      } else if (!authorityIds.includes(member.id) && hasRole) {
        changes.push(`➖ ${member.user.tag}`);
      }
    });

    return changes;
  }
}
