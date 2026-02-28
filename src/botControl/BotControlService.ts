import { Guild } from "discord.js";
import { BotControlModule } from "../modules/BotControlModule";
import { BotControlDB } from "../db/BotControlDB";
import { EmbedBuilder } from "../EmbedBuilder";

export class BotControlService {
  private module: BotControlModule;

  constructor() {
    this.module = new BotControlModule();
  }

  // Inicjalizacja systemu Bot Control
  public async init(guild: Guild) {
    const db = BotControlDB.getData(); // aktualny stan

    // 1️⃣ Tworzenie roli Bot Control, jeśli nie istnieje
    if (!db.roleId) {
      const role = await this.module.createRole(guild, "Bot Control", 0x800080);
      BotControlDB.roleId = role.id;
    }

    // 2️⃣ Tworzenie kanałów systemowych
    for (const chName of ["synchronization", "bot-commands", "alliance-logs"]) {
      if (!db.channels[chName]) {
        const channel = await this.module.createTextChannel(guild, chName, [
          { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: BotControlDB.roleId, allow: [PermissionFlagsBits.ViewChannel] }
        ]);
        BotControlDB.channels[chName] = channel.id;
      }
    }

    // 3️⃣ Embed statusu
    await EmbedBuilder.sendBotControlStatus(guild, BotControlDB);
  }

  // Aktualizacja członków z uprawnieniami
  public async updateMembers(guild: Guild, authorityIds: string[]) {
    for (const id of authorityIds) {
      const member = await guild.members.fetch(id).catch(() => null);
      if (member && !member.roles.cache.has(BotControlDB.roleId)) {
        await this.module.assignRole(member, BotControlDB.roleId);
      }
    }

    // Usuwanie roli z osób, które nie są już authority
    const membersWithRole = await guild.members.fetch();
    for (const [id, member] of membersWithRole) {
      if (!authorityIds.includes(id) && member.roles.cache.has(BotControlDB.roleId)) {
        await this.module.removeRole(member, BotControlDB.roleId);
      }
    }

    // Aktualizacja DB
    BotControlDB.authorityIds = authorityIds;
  }
}