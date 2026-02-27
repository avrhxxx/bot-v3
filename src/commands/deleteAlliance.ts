import { Message } from "discord.js";
import { AllianceService } from "../AllianceService";

// -------------------
// KOMENDA !DELETE
// -------------------
export const deleteAllianceCommand = {
  name: "delete",
  description: "Usuwa sojusz o podanej nazwie i tagu",
  execute: async (message: Message) => {
    if (!message.guild) return;

    const parts = message.content.trim().split(" ");
    if (parts.length < 3) {
      await message.reply("❌ Podaj nazwę i tag sojuszu do usunięcia, np. `!delete Behemoth CEL`");
      return;
    }

    const tag = parts.pop()!;
    const name = parts.slice(1).join(" ");

    try {
      await AllianceService.deleteAlliance(message.guild, name, tag);
      await message.reply(`✅ Sojusz "${name} • ${tag}" został usunięty!`);
    } catch (err: any) {
      await message.reply(`❌ Błąd: ${err.message}`);
    }
  }
};