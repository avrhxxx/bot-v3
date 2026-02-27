import { Message } from "discord.js";
import { AllianceService, TEST_ALLIANCE } from "../AllianceService";

export const createAllianceCommand = {
  name: "create",
  description: `Tworzy sojusz ${TEST_ALLIANCE.name}`,
  execute: async (message: Message) => {
    // Powiadomienie od razu po użyciu komendy
    await message.reply(`✅ Komenda !create użyta — sojusz ${TEST_ALLIANCE.name} w trakcie tworzenia (testowo).`);

    if (!message.guild) return;
    await AllianceService.createAlliance(message.guild);
  }
};