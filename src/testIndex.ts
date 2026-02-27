// src/testIndex.ts
import { Client, GatewayIntentBits, Guild } from "discord.js";
import { BOT_TOKEN, GUILD_ID } from "./config/config";

// Funkcja delay w ms
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
    console.log("🚀 Rozpoczynamy tworzenie testowego sojuszu...");

    // --------------------------
    // 1️⃣ Tworzenie ról
    // --------------------------
    const roles = [
      { name: `R5[${TEST_ALLIANCE_TAG}]`, color: "Red" },
      { name: `R4[${TEST_ALLIANCE_TAG}]`, color: "Blue" },
      { name: `R3[${TEST_ALLIANCE_TAG}]`, color: "Green" },
      { name: TEST_ALLIANCE_NAME, color: "Yellow" } // rola tożsamościowa
    ];

    for (const { name, color } of roles) {
      let role = guild.roles.cache.find(r => r.name === name);
      if (!role) {
        role = await guild.roles.create({ name, color, reason: `Tworzenie roli dla ${TEST_ALLIANCE_NAME}` });
        console.log(`✅ Stworzono rolę: ${name}`);
      } else {
        console.log(`Rola ${name} już istnieje`);
      }
      await delay(3000); // 3 sekundy między rolami
    }

    // --------------------------
    // 2️⃣ Tworzenie kategorii
    // --------------------------
    let category = guild.channels.cache.find(c => c.name === TEST_ALLIANCE_NAME && c.type === 4); // 4 = CategoryChannel
    if (!category) {
      category = await guild.channels.create({ name: TEST_ALLIANCE_NAME, type: 4 });
      console.log(`✅ Stworzono kategorię: ${TEST_ALLIANCE_NAME}`);
    } else {
      console.log(`Kategoria ${TEST_ALLIANCE_NAME} już istnieje`);
    }
    await delay(5000); // 5 sekund pauzy

    // --------------------------
    // 3️⃣ Tworzenie kanałów tekstowych
    // --------------------------
    const textChannels = ["👋 welcome", "📢 announce", "💬 chat", "🛡 staff-room", "✋ join"];
    for (const chName of textChannels) {
      let ch = guild.channels.cache.find(c => c.name === chName && c.parentId === category.id);
      if (!ch) {
        ch = await guild.channels.create({ name: chName, type: 0, parent: category.id }); // 0 = GuildText
        console.log(`✅ Stworzono kanał tekstowy: ${chName}`);
      } else {
        console.log(`Kanał tekstowy ${chName} już istnieje`);
      }
      await delay(2000); // 2 sekundy między kanałami
    }

    // --------------------------
    // 4️⃣ Tworzenie kanałów głosowych
    // --------------------------
    const voiceChannels = ["🎤 General VC", "🎤 Staff VC"];
    for (const chName of voiceChannels) {
      let ch = guild.channels.cache.find(c => c.name === chName && c.parentId === category.id);
      if (!ch) {
        ch = await guild.channels.create({ name: chName, type: 2, parent: category.id }); // 2 = GuildVoice
        console.log(`✅ Stworzono kanał głosowy: ${chName}`);
      } else {
        console.log(`Kanał głosowy ${chName} już istnieje`);
      }
      await delay(2000); // 2 sekundy między kanałami
    }

    console.log("🎉 Testowy sojusz został w pełni utworzony w trybie krokowym!");
  } catch (err) {
    console.error("❌ Błąd podczas tworzenia testowego sojuszu:", err);
  }
});

// Logowanie bota
client.login(BOT_TOKEN).catch(err => {
  console.error("Nie udało się zalogować testowego bota:", err);
});