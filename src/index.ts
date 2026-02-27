import { Client, GatewayIntentBits, Guild } from "discord.js";
import { BOT_TOKEN, GUILD_ID } from "./config/config";
import { RoleModule } from "./modules/role/RoleModule";
import { ChannelModule } from "./modules/channel/ChannelModule";

// Tworzymy klienta Discord
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", async () => {
  console.log(`Bot zalogowany jako ${client.user?.tag}`);

  // Pobieramy guild z cache po ID
  const guild: Guild | undefined = client.guilds.cache.get(GUILD_ID);
  if (!guild) {
    console.log(`Nie znaleziono guilda o ID ${GUILD_ID}.`);
    return;
  }

  // Minimalne stuby - role i kanały
  try {
    // Tworzymy podstawowe role: R5, R4, R3
    await RoleModule.ensureRoles(guild);

    // Tworzymy kategorię tylko z nazwą sojuszu i wszystkie standardowe kanały w środku
    await ChannelModule.createChannels(guild, "alliance-stub");

    console.log("Role i kanały (szkielet) zostały utworzone.");
  } catch (err: any) {
    console.error("Błąd podczas tworzenia ról/kanałów:", err.message || err);
  }
});

// Logowanie bota
client.login(BOT_TOKEN).catch(err => {
  console.error("Nie udało się zalogować bota:", err);
});