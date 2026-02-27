import { Client, GatewayIntentBits, Guild } from "discord.js";
import { BOT_TOKEN, GUILD_ID } from "./config/config";
import { RoleModule } from "./modules/role/RoleModule";
import { ChannelModule } from "./modules/channel/ChannelModule";

// Testowy sojusz
const TEST_ALLIANCE_TAG = "TsT";
const TEST_ALLIANCE_NAME = "TestAlliance";
const TEST_ALLIANCE_ID = "alliance-test";

// Tworzymy klienta Discord
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", async () => {
  console.log(`Testowy bot zalogowany jako ${client.user?.tag}`);

  const guild: Guild | undefined = client.guilds.cache.get(GUILD_ID);
  if (!guild) {
    console.log(`Nie znaleziono guilda o ID ${GUILD_ID}.`);
    return;
  }

  try {
    // --------------------------
    // 1️⃣ Tworzymy role dla testowego sojuszu
    // --------------------------
    const createdRoles = await RoleModule.createRoles(
      guild,
      TEST_ALLIANCE_TAG,
      TEST_ALLIANCE_NAME
    );
    console.log("Stworzone role:", createdRoles);

    // --------------------------
    // 2️⃣ Tworzymy szkielet kanałów testowego sojuszu
    // --------------------------
    const createdChannels = await ChannelModule.createChannels(
      guild,
      TEST_ALLIANCE_ID,
      TEST_ALLIANCE_TAG,
      TEST_ALLIANCE_NAME
    );
    console.log("Stworzone kanały (szkielet):", createdChannels);

    console.log("✅ Testowy sojusz został utworzony w pełnym minimalnym trybie.");
  } catch (err) {
    console.error("Błąd podczas tworzenia testowego sojuszu:", err);
  }
});

// Logowanie bota
client.login(BOT_TOKEN).catch(err => {
  console.error("Nie udało się zalogować testowego bota:", err);
});