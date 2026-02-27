import { Message } from "discord.js";
import { AllianceService, TEST_ALLIANCE } from "../AllianceService";

export const deleteAllianceCommand = {
  name: "delete",
  description: `Usuwa sojusz ${TEST_ALLIANCE.name}`,
  execute: async (message: Message) => {
    // Powiadomienie od razu po użyciu komendy
    await message.reply(`✅ Komenda !delete użyta — sojusz ${TEST_ALLIANCE.name} w trakcie usuwania (testowo).`);

    if (!message.guild) return;
    await AllianceService.deleteAlliance(message.guild);
  }
};