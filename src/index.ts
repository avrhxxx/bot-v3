import { Client, GatewayIntentBits, Guild } from "discord.js";
import { BOT_TOKEN, GUILD_ID } from "./config/config";
import { RoleModule } from "./modules/role/RoleModule";
import { ChannelModule } from "./modules/channel/ChannelModule";

// Tworzymy klienta Discord
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", async () => {
  console.log(`Bot zalogowany jako ${client.user?.tag}`);

  const guild: Guild | undefined = client.guilds.cache.get(GUILD_ID);
  if (!guild) {
    console.log(`Nie znaleziono guilda o ID ${GUILD_ID}.`);
    return;
  }

  try {
    // Tworzymy role R5/R4/R3
    await RoleModule.ensureRoles(guild);

    // Tworzymy kategorię + kanały sojuszu (szkielet)
    await ChannelModule.createChannels(guild, "alliance-stub", "STB", "SojuszStub");

    console.log("Role i kanały (szkielet) zostały utworzone.");
  } catch (err) {
    console.error("Błąd podczas tworzenia ról/kanałów:", err);
  }
});

// Logowanie bota
client.login(BOT_TOKEN).catch(err => {
  console.error("Nie udało się zalogować bota:", err);
});