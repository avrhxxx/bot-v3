import { REST, Routes } from "discord.js";
import { config } from "./config/config";
import { XsysCommand } from "./commands/XsysCommand";

const commands = [
  new XsysCommand().data.toJSON()
];

const rest = new REST({ version: "10" }).setToken(config.token);

(async () => {
  try {
    console.log("Deploying slash commands...");

    await rest.put(
      Routes.applicationCommands(config.clientId),
      { body: commands }
    );

    console.log("Slash commands deployed.");
  } catch (error) {
    console.error(error);
  }
})();