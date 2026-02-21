import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { Command } from "./Command";

export class XsysCommand implements Command {
  data = new SlashCommandBuilder()
    .setName("xsys")
    .setDescription("System diagnostic information");

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    throw new Error("TEST ERROR");
  }
}