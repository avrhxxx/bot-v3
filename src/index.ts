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

  try {
    // --------------------------
    // 1️⃣ Tworzymy role dla testowego sojuszu
    // --------------------------
    await RoleModule.createRoles(guild, "TsT", "TestAlliance");

    // --------------------------
    // 2️⃣ Tworzymy szkielet kanałów testowego sojuszu
    // --------------------------
    await ChannelModule.createChannels(guild, "test-alliance", "TsT", "TestAlliance");

    console.log("Role i kanały (szkielet) dla TestAlliance zostały utworzone.");
  } catch (err) {
    console.error("Błąd podczas tworzenia ról/kanałów:", err);
  } finally {
    // Po testach można wylogować bota, żeby nie trzymać połączenia
    setTimeout(() => client.destroy(), 5000);
  }
});

// Logowanie bota
client.login(BOT_TOKEN).catch(err => {
  console.error("Nie udało się zalogować bota:", err);
});