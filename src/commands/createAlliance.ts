import { Message } from "discord.js";
import { AllianceService } from "../AllianceService";

// -------------------
// KOMENDA !CREATE
// -------------------
export const createAllianceCommand = {
  name: "create",
  description: "Tworzy nowy sojusz z podaną nazwą i tagiem",
  execute: async (message: Message) => {
    if (!message.guild) return;

    const parts = message.content.trim().split(" ");
    if (parts.length < 3) {
      await message.reply("❌ Podaj nazwę i tag sojuszu, np. `!create Behemoth CEL`");
      return;
    }

    const tag = parts.pop()!; // ostatni element jako tag
    const name = parts.slice(1).join(" "); // reszta jako nazwa

    try {
      await AllianceService.createAlliance(message.guild, name, tag);
      await message.reply(`✅ Sojusz "${name} • ${tag}" w pełni utworzony!`);
    } catch (err: any) {
      await message.reply(`❌ Błąd: ${err.message}`);
    }
  }
};