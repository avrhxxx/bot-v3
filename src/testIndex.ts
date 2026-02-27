// src/testIndex.ts
import { Client, GatewayIntentBits, Guild, ColorResolvable } from "discord.js";
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
    await delay(5000); // start komendy 5s

    // --------------------------
    // 1️⃣ Tworzenie ról
    // --------------------------
    const roles = [
      { name: `R5[${TEST_ALLIANCE_TAG}]`, color: "#FF0000" }, // czerwony
      { name: `R4[${TEST_ALLIANCE_TAG}]`, color: "#0000FF" }, // niebieski
      { name: `R3[${TEST_ALLIANCE_TAG}]`, color: "#00FF00" }, // zielony
      { name: TEST_ALLIANCE_NAME, color: "#FFFF00" } // rola tożsamościowa
    ];

    const createdRoles: string[] = [];

    for (const { name, color } of roles) {
      let role = guild.roles.cache.find(r => r.name === name);
      if (!role) {
        role = await guild.roles.create({ name, color: color as ColorResolvable, reason: `Tworzenie roli dla ${TEST_ALLIANCE_NAME}` });
        console.log(`✅ Stworzono rolę: ${name}`);
      } else {
        console.log(`❌ Rola ${name} już istnieje! Przerywam tworzenie sojuszu.`);
        return; // gate: jeśli rola istnieje, kończymy
      }
      createdRoles.push(name);
      await delay(3000); // 3s między rolami
    }

    // --------------------------
    // 2️⃣ Tworzenie kategorii
    // --------------------------
    await delay(5000); // 5 sekund przed kategorią
    let category = guild.channels.cache.find(c => c.name === TEST_ALLIANCE_NAME && c.type === 4); // 4 = CategoryChannel
    if (!category) {
      category = await guild.channels.create({ name: TEST_ALLIANCE_NAME, type: 4 });
      console.log(`✅ Stworzono kategorię: ${TEST_ALLIANCE_NAME}`);

      // --------------------------
      // 3️⃣ Tworzenie kanałów tylko jeśli nowa kategoria
      // --------------------------
      const textChannels = ["👋 welcome", "📢 announce", "💬 chat", "🛡 staff-room", "✋ join"];
      for (const chName of textChannels) {
        const ch = await guild.channels.create({ name: chName, type: 0, parent: category.id }); // 0 = GuildText
        console.log(`✅ Stworzono kanał tekstowy: ${chName}`);
        await delay(3000); // 3s między kanałami
      }

      const voiceChannels = ["🎤 General VC", "🎤 Staff VC"];
      for (const chName of voiceChannels) {
        const ch = await guild.channels.create({ name: chName, type: 2, parent: category.id }); // 2 = GuildVoice
        console.log(`✅ Stworzono kanał głosowy: ${chName}`);
        await delay(3000); // 3s między kanałami
      }

    } else {
      console.log(`❌ Kategoria ${TEST_ALLIANCE_NAME} już istnieje. Kanały nie zostały tworzone.`);
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